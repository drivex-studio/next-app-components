import React from 'react';
import dynamic from 'next/dynamic';
const CustomCursor = dynamic(
  () => import('../ui/CustomCursor').then((mod) => mod.CustomCursor),
  { ssr: false }
);

export function LazyCustomCursor(props) {
  const { children } = props;

  return (
    <CustomCursor>
      {children}
    </CustomCursor>
  );
}