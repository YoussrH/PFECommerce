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
    <div className="container mx-auto px-10 py-8">
      <Tabs defaultValue="size">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="size">Par taille</TabsTrigger>
          <TabsTrigger value="bulk">Groupé</TabsTrigger>
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