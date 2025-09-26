// utils/http.ts
import { Response } from "express";

export const ok = (res: Response, data: any, meta?: any): void => {
  res.status(200).json({ success: true, data, meta });
};

export const created = (res: Response, data: any): void => {
  res.status(201).json({ success: true, data });
};

export const badRequest = (res: Response, message: string): void => {
  res.status(400).json({ success: false, message });
};

export const notFound = (res: Response, message = "Not found"): void => {
  res.status(404).json({ success: false, message });
};

export const serverError = (res: Response, err: any): void => {
  console.error(err);
  res
    .status(500)
    .json({ success: false, message: err?.message || "Server error" });
};
