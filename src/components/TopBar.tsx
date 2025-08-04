"use client";
import React from "react";
import { AuthMenu } from "./AuthModal";

export default function TopBar() {
  return (
    <div
      style={{
        maxWidth: 1080,
        margin: "12px auto 0",
        padding: "0 16px",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 12,
      }}
    >
      <AuthMenu />
    </div>
  );
}