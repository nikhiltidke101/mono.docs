import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { utilsPublic, type PagePublic } from "@/utils/source";
import { DocsBody } from "fumadocs-ui/page";
import { Card, Cards } from "fumadocs-ui/components/card";
import { DocsPage } from "@/modules/ui/page";

export default async function Page({
  params,
}: {
  params: { slug?: string[] };
}) {
  const page = utilsPublic.getPage(params.slug);

  if (!page) redirect("/beta");

  return (
    <DocsPage
      toc={page.data.exports.toc}
      tableOfContent={{
        enabled: page.data.toc,
      }}
    >
      <DocsBody>
        {page.data.index ? (
          <Category page={page} />
        ) : (
          <page.data.exports.default />
        )}
      </DocsBody>
    </DocsPage>
  );
}

function Category({ page }: { page: PagePublic }): React.ReactElement {
  const filtered = utilsPublic
    .getPages()
    .filter(
      (item) =>
        item.file.dirname === page.file.dirname && item.file.name !== "index"
    );

  return (
    <Cards>
      {filtered.map((item) => (
        <Card
          key={item.url}
          href={item.url}
          title={item.data.title}
          description={item.data.description ?? "No Description"}
        />
      ))}
    </Cards>
  );
}

export async function generateStaticParams() {
  return utilsPublic.getPages().map((page) => ({
    slug: page.slugs,
  }));
}

export function generateMetadata({ params }: { params: { slug?: string[] } }) {
  const page = utilsPublic.getPage(params.slug);

  if (page == null) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  } satisfies Metadata;
}
