import { Suspense } from 'react';
import ResetClient from './ResetClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function Page({ searchParams }: PageProps) {
  const invalidLink = searchParams?.invalidLink === '1';
  return (
    <Suspense fallback={<div />}>
      <ResetClient invalidLink={invalidLink} />
    </Suspense>
  );
}