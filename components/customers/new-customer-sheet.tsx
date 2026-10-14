"use client"

import { PlusIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"

import { CustomerFields } from "./customer-fields"
import { useCustomerForm } from "./use-customer-form"

/** Nouveau client ou chantier, sans quitter la liste : quelques champs suffisent. */
export function NewCustomerSheet() {
  const t = useTranslations()
  const [open, setOpen] = useState(false)
  const { form, submit, pending } = useCustomerForm(undefined)

  const onSubmit = form.handleSubmit(async (values) => {
    const customer = await submit(values)
    if (!customer) return
    toast.success(t("customers.created", { name: customer.name }))
    form.reset({ ...form.formState.defaultValues, name: "" })
    setOpen(false)
  })

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="lg" />}>
        <PlusIcon />
        {t("customers.new")}
      </SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{t("customers.new")}</SheetTitle>
          <SheetDescription>{t("customers.newDescription")}</SheetDescription>
        </SheetHeader>
        <form
          onSubmit={(event) => void onSubmit(event)}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <CustomerFields form={form} autoFocus />
          </div>
          <SheetFooter className="border-t">
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Spinner />}
              {t("customers.form.create")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
