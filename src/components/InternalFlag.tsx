'use client';

import { useEffect } from 'react';
import { rememberInternalFlag } from '@/lib/analytics';

/** Remembers ?internal=1 in this browser so our own clicks stay out of the reports. */
export default function InternalFlag() {
  useEffect(() => { rememberInternalFlag(window.location.search); }, []);
  return null;
}
