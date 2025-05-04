import { z } from "zod";

/**
 * Common password validator that can be reused across the application
 * Validates that a password:
 * - Is at least 8 characters long
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 * - Contains at least one special character
 */
export const passwordValidator = z.string()
  .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
  .max(32, "Mật khẩu không được vượt quá 32 ký tự")
  .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ in hoa")
  .regex(/[a-z]/, "Mật khẩu phải chứa ít nhất 1 chữ thường")
  .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 số")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt");

/**
 * Validates a password with all common criteria
 * Returns true if valid, otherwise returns error message
 */
export const validatePassword = (password: string): true | string => {
  const result = passwordValidator.safeParse(password);
  
  if (result.success) {
    return true;
  } else {
    // Get the first error message
    const formattedError = result.error.format();
    return formattedError._errors[0] || "Mật khẩu không hợp lệ";
  }
};

/**
 * Validates that two passwords match
 * Returns true if valid, otherwise returns error message
 */
export const validatePasswordsMatch = (
  password: string,
  confirmPassword: string
): true | string => {
  if (password !== confirmPassword) {
    return "Mật khẩu xác nhận không khớp";
  }
  return true;
};