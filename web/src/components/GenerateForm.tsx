"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { generateFormSchema, toneOptions, type GenerateFormValues } from "@/lib/schema";
import type { GenerateCopyRequest } from "@/lib/types";

const toneLabels: Record<(typeof toneOptions)[number], string> = {
  formal: "Formal",
  casual: "Casual",
  divertido: "Divertido",
};

interface GenerateFormProps {
  isGenerating: boolean;
  onSubmit: (request: GenerateCopyRequest) => void;
}

export function GenerateForm({ isGenerating, onSubmit }: GenerateFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<GenerateFormValues>({
    resolver: zodResolver(generateFormSchema),
    defaultValues: {
      productName: "",
      features: [{ value: "" }],
      tone: "casual",
      language: "es",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "features" });

  function submit(values: GenerateFormValues) {
    onSubmit({
      productName: values.productName,
      features: values.features.map((f) => f.value),
      tone: values.tone,
      language: values.language,
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <div>
        <label htmlFor="productName" className="block text-sm font-medium text-neutral-200">
          Nombre del producto
        </label>
        <input
          id="productName"
          type="text"
          placeholder="Mate de acero inoxidable"
          className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-emerald-500"
          {...register("productName")}
        />
        {errors.productName && (
          <p className="mt-1 text-sm text-red-400">{errors.productName.message}</p>
        )}
      </div>

      <div>
        <span className="block text-sm font-medium text-neutral-200">Características</span>
        <div className="mt-1 space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <input
                type="text"
                placeholder={`Característica ${index + 1}`}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-emerald-500"
                {...register(`features.${index}.value` as const)}
              />
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                className="rounded-lg border border-neutral-700 px-3 text-neutral-400 hover:text-red-400 disabled:opacity-30"
                aria-label="Quitar característica"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {errors.features && (
          <p className="mt-1 text-sm text-red-400">
            {errors.features.message ?? errors.features.root?.message}
          </p>
        )}
        <button
          type="button"
          onClick={() => append({ value: "" })}
          disabled={fields.length >= 10}
          className="mt-2 inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 disabled:opacity-30"
        >
          <Plus className="h-4 w-4" /> Agregar característica
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="tone" className="block text-sm font-medium text-neutral-200">
            Tono
          </label>
          <select
            id="tone"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-emerald-500"
            {...register("tone")}
          >
            {toneOptions.map((tone) => (
              <option key={tone} value={tone}>
                {toneLabels[tone]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="language" className="block text-sm font-medium text-neutral-200">
            Idioma
          </label>
          <input
            id="language"
            type="text"
            placeholder="es"
            className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-emerald-500"
            {...register("language")}
          />
          {errors.language && (
            <p className="mt-1 text-sm text-red-400">{errors.language.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isGenerating}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Generando...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Generar descripción
          </>
        )}
      </button>
    </form>
  );
}
