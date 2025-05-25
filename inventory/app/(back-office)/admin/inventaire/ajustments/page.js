"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from '@/app/contexts/AuthContext'
import SizeAdjustment from '@/app/components/DashboardComponents/AjustmentComp/AjustementTaille'
import BulkAdjustment from '@/app/components/DashboardComponents/AjustmentComp/AjustmentGroupe'
import AjustementTaille from "@/app/components/DashboardComponents/AjustmentComp/AjustementTaille"

export default function AdjustmentsPage() {
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
    <div className="container mx-auto px-10 py-8 h-screen">
      <Tabs defaultValue="size" className="w-full h-full ">
        <TabsList className="grid w-full grid-cols-2 h-12 bg-white gap-3 shadow-sm ">
        <TabsTrigger
  value="size"  className="h-10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-100 data-[state=active]:to-white">
  Par taille</TabsTrigger>

<TabsTrigger value="bulk"  className="h-10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-50 data-[state=active]:to-white">  Groupé</TabsTrigger>
</TabsList>

        <TabsContent value="size">
          <AjustementTaille />
        </TabsContent>

        <TabsContent value="bulk">
          <BulkAdjustment />
        </TabsContent>
      </Tabs>
    </div>
  )
}