export function customerReturnTo(value?: string) {
  if (value === "/checkout" || value === "/account") return value;
  if (value && /^\/order\/ZY-[A-Z0-9]{6,12}$/.test(value)) return value;
  return "/account";
}
