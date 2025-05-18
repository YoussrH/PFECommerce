import ArticleTable from "@/app/components/DashboardComponents/ArticleComp/ArticlesTable";

export default function Home() {
  return (
    <main className="container  mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion des Articles</h1>
      <ArticleTable />
    </main>
  )
}
