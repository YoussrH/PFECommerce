"use client";

import HomeNavs from "./HomeNavs";


export default function HomeLayout({ children }) {
  return (
    <div>
      <HomeNavs />

      <div>{children}</div>
    </div>
  );
}