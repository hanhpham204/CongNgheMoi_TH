function validateTicket(data) {

  const errors = [];

  if (!data.ticketId || data.ticketId.trim() === "") {
    errors.push("Mã vé không được rỗng");
  }

  if (!data.eventName || data.eventName.trim().length < 3) {
    errors.push("Tên sự kiện ít nhất 3 ký tự");
  }

  if (isNaN(data.price) || Number(data.price) <= 0) {
    errors.push("Giá vé phải > 0");
  }

  if (isNaN(data.quantity) || Number(data.quantity) < 0) {
    errors.push("Số lượng phải >= 0");
  }

  return errors;
}

module.exports = validateTicket;