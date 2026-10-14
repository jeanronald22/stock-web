"use client"

import { useEffect, useState } from "react"
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"

import { StepTransition } from "@/components/motion/step-transition"
import { useStepNavigation } from "@/components/motion/use-step-navigation"

import { StepShell } from "./step-shell"

const FORM_ID = "form-wizard"

export type WizardStep<T extends FieldValues> = {
  key: string
  /** Scène abstraite de l'étape (components/illustrations). */
  illustration: React.ReactNode
  title: string
  description: string
  /** Champs vérifiés avant de passer à l'étape suivante. */
  fields: readonly Path<T>[]
  content: React.ReactNode
}

/**
 * Assistant à la manière d'Airbnb : une question et une illustration par écran, un seul formulaire
 * pour toutes les étapes (revenir en arrière ne perd rien). Si l'API refuse un champ d'une étape
 * précédente (nom déjà pris…), l'assistant y revient.
 */
export function FormWizard<T extends FieldValues>({
  form,
  steps,
  eyebrow,
  nextLabel,
  submitLabel,
  submitting,
  onSubmit,
  onExit,
  exitLabel,
}: {
  form: UseFormReturn<T>
  steps: readonly WizardStep<T>[]
  eyebrow: string
  nextLabel: string
  submitLabel: string
  submitting: boolean
  /** Renvoie false si l'enregistrement a échoué (erreurs placées sur les champs). */
  onSubmit: (values: T) => Promise<boolean>
  onExit: () => void
  exitLabel: string
}) {
  const [index, setIndex] = useState(0)
  const navigate = useStepNavigation<number>(setIndex)
  const step = steps[index]
  const last = index === steps.length - 1

  // Un champ en erreur se revérifie à la frappe : le message disparaît dès que la saisie est juste,
  // sans attendre le prochain « Continuer » (l'assistant valide par étape, pas par envoi).
  useEffect(() => {
    const subscription = form.watch((_, { name }) => {
      if (name && form.getFieldState(name).invalid) void form.trigger(name)
    })
    return () => subscription.unsubscribe()
  }, [form])

  const returnToFirstInvalidStep = () => {
    const invalid = steps.findIndex((candidate) =>
      candidate.fields.some((field) => form.getFieldState(field).invalid)
    )
    if (invalid >= 0 && invalid < index) navigate.back(invalid)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!last) {
      if (await form.trigger(step.fields, { shouldFocus: true }))
        navigate.forward(index + 1)
      return
    }
    await form.handleSubmit(async (values) => {
      if (!(await onSubmit(values))) returnToFirstInvalidStep()
    }, returnToFirstInvalidStep)(event)
  }

  return (
    <StepTransition stepKey={step.key}>
      <StepShell
        step={index + 1}
        totalSteps={steps.length}
        illustration={step.illustration}
        eyebrow={eyebrow}
        title={step.title}
        description={step.description}
        formId={FORM_ID}
        submitLabel={last ? submitLabel : nextLabel}
        submitting={submitting}
        onBack={index > 0 ? () => navigate.back(index - 1) : undefined}
        onExit={onExit}
        exitLabel={exitLabel}
      >
        <form
          id={FORM_ID}
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
        >
          {step.content}
        </form>
      </StepShell>
    </StepTransition>
  )
}
