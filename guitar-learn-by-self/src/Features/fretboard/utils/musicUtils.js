// fretboard/utils/musicUtils.js
// Có thể thêm các hàm tiện ích liên quan đến âm nhạc ở đây
export const getNoteName = (note, isSharp) => {
  return isSharp ? `${note}#` : note;
};

// Thêm các hàm khác nếu cần
