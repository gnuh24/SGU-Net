import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { DATE_FORMATS } from "../constants";

export const formatDate = (
  date: string | Date,
  formatType: keyof typeof DATE_FORMATS = "DISPLAY"
): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, DATE_FORMATS[formatType], { locale: vi });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export const formatNumber = (number: number): string => {
  return new Intl.NumberFormat("vi-VN").format(number);
};

export const parseNumber = (value: string): number => {
  return parseFloat(value.replace(/[^\d.-]/g, "")) || 0;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: number;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    active: "green",
    inactive: "red",
    pending: "orange",
    paid: "green",
    cancelled: "red",
    success: "green",
    warning: "orange",
    error: "red",
    info: "blue",
  };

  return statusColors[status] || "default";
};

export const validateBarcode = (barcode: string): boolean => {
  return /^\d{8,13}$/.test(barcode);
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return /^\d{10,11}$/.test(phone);
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100; // Round to 2 decimal places
};

export const downloadFile = (
  data: any,
  filename: string,
  type: string = "application/json"
): void => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => JSON.stringify(row[header])).join(",")
    ),
  ].join("\n");

  downloadFile(csvContent, `${filename}.csv`, "text/csv");
};

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
