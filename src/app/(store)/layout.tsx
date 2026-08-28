import { Header } from "@/components/store/header";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      {/* Header is `fixed`, taken out of document flow entirely, so this
          offset (h-9 announcement bar + h-16 nav row = 6.25rem) is the
          only thing standing between it and covering the top of every
          page's content. */}
      <div className="flex flex-1 flex-col pt-25">{children}</div>
    </>
  );
}
