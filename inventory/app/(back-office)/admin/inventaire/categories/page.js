
"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from '@/app/contexts/AuthContext'
import CategoryTable from '@/app/components/DashboardComponents/CategorieComp/CategoryTable'
import AjouterTailleGroupe from "@/app/components/DashboardComponents/CategorieComp/AjouterTailleGroupe"

export default function Categories() {
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-gray-500">
          Les privilèges d&apos;administrateur sont nécessaires
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-10 py-8">
      <Tabs defaultValue="categories">
        
        <TabsList className="grid w-full grid-cols-2 h-12 bg-white gap-3 shadow-sm ">
        <TabsTrigger  value="categories" className="h-10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-200 data-[state=active]:to-white">Catégories</TabsTrigger>

        <TabsTrigger value="sizes" className="h-10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-200 data-[state=active]:to-white">Tailles</TabsTrigger>
        </TabsList>


        <TabsContent value="categories">
          <CategoryTable />
        </TabsContent>

        <TabsContent value="sizes">
          <AjouterTailleGroupe />
        </TabsContent>
      </Tabs>
    </div>
  )
}