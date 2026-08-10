"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Free Shipping on Orders Above ₹999",
  "New Arrivals Every Week",
  "Handloom Sarees, Handpicked for You",
];

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % MESSAGES.length),
      4000,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-meta bg-primary py-2 text-center font-medium tracking-wide text-primary-foreground">
      {MESSAGES[index]}
    </div>
  );
}
