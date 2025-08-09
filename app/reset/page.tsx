import { Suspense } from 'react';
import ResetClient from './ResetClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SearchParams =
  | Record<string, string | string[] | undefined>
  | null
  | undefined;

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const invalidLink = sp?.['invalidLink'] === '1';

  return (
    <Suspense fallback={<div />}>
      <ResetClient invalidLink={invalidLink} />
    </Suspense>
  );
}