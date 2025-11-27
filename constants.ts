// 1. 測試模式開關 (TEST MODE)
// 設定為 true: 跳過倒數，直接開始遊戲 (方便測試)
// 設定為 false: 正式上線，啟用倒數計時
export const TEST_MODE = false;

// 2. 遊戲設定
export const TARGET_DATE = "2025-11-30T20:00:00"; // 遊戲開始時間
export const GITHUB_BASE_URL = ""; // 圖片素材路徑

// 3. 題目答案設定 (CARDS)
// 請在 answer 欄位填入正確的咒語答案
export const CARDS_CONFIG = [
  { id: 1, answer: "b74373ee429b49c01636ba65e7c4884be13807031bb46a29be3ad149c4a48af6" },
  { id: 2, answer: "70c779de3bc1337f842b9ce2a97b54f27b9334aae60ecf1060d57d5e2225bb6b" },
  { id: 3, answer: "59643d5dc0153442a5a9014d5b6c82cdcb6d53027fd78dacef527c7818901737" },
  { id: 4, answer: "5725693a81c41bd1bb6a80477e9189ba938c7d1d05a8eaf5d500ddec5b63bef1" },
  { id: 5, answer: "eba03aaf9113950b7eb4ae6f610281b2add7ec658ca08b96a0c27e4ab5fbf7d3" },
  { id: 6, answer: "793a84a351bd364d2f0323b67b39407711e54bc4748c439fb32734538ef8dd15" },
  { id: 7, answer: "c688fe9d72d2aa7634f4e503cd6cd6a56825e90bfa2bcef8e8b755586e2e493d" },
];

// 4. 最終題目答案 (LIGHT 3)
export const FINAL_ANSWER = "86e50149658661312a9e0b35558d84f6c6d3da797f552a9657fe0558ca40cdef";

// 圖片路徑輔助函式
export const getImg = (name: string) => `/${name}`;
