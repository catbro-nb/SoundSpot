"""
音频指纹识别模块 v2
- 核心改进：使用子序列交叉相关匹配，解决录音与原曲时间偏移问题
- 启动时对库中所有歌曲提取指纹
- 用户上传录音时提取指纹并比对
- 大量调试日志输出，方便排查识别失败
"""
import os
import numpy as np
import librosa
from typing import Optional

AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "audio")

# 指纹数据库：{ song_audio_filename: { "chroma": np.ndarray, "mfcc": np.ndarray } }
_fingerprint_db: dict = {}


def _extract_features(file_path: str, sr: int = 22050, duration: float = 30.0) -> dict:
    """从音频文件中提取特征（chroma_cqt + mfcc）"""
    try:
        y, _ = librosa.load(file_path, sr=sr, duration=duration, mono=True)
    except Exception as e:
        print(f"[WARN] Cannot load audio: {e}")
        return {"chroma": np.array([]), "mfcc": np.array([])}

    if len(y) == 0:
        return {"chroma": np.array([]), "mfcc": np.array([])}

    # 音量归一化
    peak = np.max(np.abs(y))
    if peak > 0:
        y = y / peak * 0.8

    # CQT chroma（对噪声和音高偏移更鲁棒）
    chroma = librosa.feature.chroma_cqt(
        y=y, sr=sr, n_chroma=12,
        hop_length=512,  # ~23ms per frame
    )

    # MFCC 特征（音色特征）
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20, hop_length=512)

    return {
        "chroma": chroma,   # shape: (12, T)
        "mfcc": mfcc,       # shape: (20, T)
    }


def build_fingerprint_db(audio_dir: str = AUDIO_DIR):
    """启动时构建指纹库"""
    global _fingerprint_db
    _fingerprint_db = {}

    if not os.path.exists(audio_dir):
        print(f"[WARN] Audio dir not found: {audio_dir}")
        return

    for fname in sorted(os.listdir(audio_dir)):
        if fname.endswith((".mp3", ".wav")):
            fpath = os.path.join(audio_dir, fname)
            try:
                features = _extract_features(fpath, duration=60)  # 提取前60秒，更多特征
                if features["chroma"].size > 0:
                    _fingerprint_db[fname] = features
                    frames = features["chroma"].shape[1]
                    print(f"  [FP] {fname} OK ({frames} frames)")
            except Exception as e:
                print(f"  [FP] {fname} ERROR: {e}")

    print(f"[OK] Fingerprint DB: {len(_fingerprint_db)} tracks")


def match_audio(query_path: str) -> Optional[dict]:
    """
    将录音与指纹库比对 v2
    核心改进：使用子序列交叉相关，自动搜索最佳时间偏移
    返回匹配结果 {"filename": str, "confidence": float} 或 None
    """
    if not _fingerprint_db:
        print("[MATCH] Fingerprint DB is empty!")
        return None

    try:
        query_features = _extract_features(query_path, duration=30)
    except Exception as e:
        print(f"[MATCH] Failed to extract query features: {e}")
        return None

    if query_features["chroma"].size == 0:
        print("[MATCH] Query has no chroma features")
        return None

    query_chroma = query_features["chroma"]   # (12, Tq)
    query_mfcc = query_features["mfcc"]       # (20, Tq)
    Tq = query_chroma.shape[1]
    print(f"[MATCH] Query: {Tq} frames ({Tq * 512 / 22050:.1f}s)")

    # ─── 对每首歌做子序列交叉相关匹配 ───
    scores = []
    for fname, db_features in _fingerprint_db.items():
        db_chroma = db_features["chroma"]  # (12, Tr)
        db_mfcc = db_features["mfcc"]      # (20, Tr)

        # 1. Chroma 子序列交叉相关
        chroma_score = _subsequence_cross_corr(query_chroma, db_chroma)

        # 2. MFCC 子序列交叉相关
        mfcc_score = _subsequence_cross_corr(query_mfcc, db_mfcc)

        # 3. 综合分数（chroma 权重更高，旋律是核心）
        combined = 0.75 * chroma_score + 0.25 * mfcc_score

        scores.append((fname, combined, chroma_score, mfcc_score))
        print(f"  [MATCH] {fname}: combined={combined:.4f} (chroma={chroma_score:.4f}, mfcc={mfcc_score:.4f})")

    # 按综合分数排序
    scores.sort(key=lambda x: x[1], reverse=True)

    best_name = scores[0][0]
    best_score = scores[0][1]
    best_chroma = scores[0][2]
    second_score = scores[1][1] if len(scores) > 1 else 0.0
    gap = best_score - second_score

    print(f"[MATCH] Best: {best_name} score={best_score:.4f}")
    print(f"[MATCH] 2nd:  {scores[1][0]} score={second_score:.4f}")
    print(f"[MATCH] Gap: {gap:.4f}")

    # ─── 动态阈值判断 ───
    # 麦克风录音信号损失大，绝对阈值降低
    # 但需要 gap 足够大来区分相似歌曲
    threshold_abs = 0.55  # 麦克风录音不可能太高，0.55 起步

    if best_score >= 0.85:
        threshold_gap = 0.03  # 高分时要求小 gap 即可
    elif best_score >= 0.70:
        threshold_gap = 0.02  # 中等分数要求更小 gap
    elif best_score >= threshold_abs:
        threshold_gap = 0.01  # 低分但远超第二名也接受
    else:
        print(f"[MATCH] REJECTED: best_score {best_score:.4f} < abs_threshold {threshold_abs}")
        return None

    if gap < threshold_gap:
        print(f"[MATCH] REJECTED: gap {gap:.4f} < gap_threshold {threshold_gap}")
        return None

    print(f"[MATCH] ACCEPTED: {best_name} with confidence {best_score:.4f}")
    return {
        "filename": best_name,
        "confidence": best_score,
    }


def _subsequence_cross_corr(query: np.ndarray, reference: np.ndarray) -> float:
    """
    子序列交叉相关匹配
    query: (F, Tq)  录音特征
    reference: (F, Tr)  参考曲目特征

    原理：在参考曲目的每个时间偏移处，计算录音片段与参考片段的余弦相似度，
    取最高值作为匹配分数。这解决了录音从歌曲中间开始的问题。
    """
    Tq = query.shape[1]
    Tr = reference.shape[1]

    if Tq == 0 or Tr == 0:
        return 0.0

    # 如果录音比参考还长，反过来搜索
    if Tq > Tr:
        query, reference = reference, query
        Tq, Tr = Tr, Tq

    # 归一化每帧（L2 normalize）—— 对余弦相似度至关重要
    q_norm = np.linalg.norm(query, axis=0, keepdims=True)
    r_norm = np.linalg.norm(reference, axis=0, keepdims=True)

    q_norm = np.where(q_norm == 0, 1, q_norm)
    r_norm = np.where(r_norm == 0, 1, r_norm)

    q_normed = query / q_norm   # (F, Tq)
    r_normed = reference / r_norm  # (F, Tr)

    # 使用滑动窗口计算余弦相似度
    # 对每个偏移 t（0 <= t <= Tr - Tq），计算 sum of frame-wise cosine sim
    best_score = 0.0
    best_offset = 0

    # 步长优化：不需要逐帧搜索，每2帧搜一次
    step = 2
    n_windows = (Tr - Tq) // step + 1

    for i in range(n_windows):
        t = i * step
        # 取参考曲目中从 t 开始的 Tq 帧窗口
        ref_window = r_normed[:, t:t + Tq]  # (F, Tq)

        # 逐帧点积然后求和 → 即为余弦相似度的总和
        frame_sims = np.sum(q_normed * ref_window, axis=0)  # (Tq,)
        score = np.mean(frame_sims)  # 平均每帧相似度

        if score > best_score:
            best_score = score
            best_offset = t

    # 精细搜索：在最佳偏移附近 ±step 范围内逐帧搜索
    fine_start = max(0, best_offset - step)
    fine_end = min(Tr - Tq, best_offset + step)
    for t in range(fine_start, fine_end + 1):
        ref_window = r_normed[:, t:t + Tq]
        frame_sims = np.sum(q_normed * ref_window, axis=0)
        score = np.mean(frame_sims)
        if score > best_score:
            best_score = score

    return float(best_score)
