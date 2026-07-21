import { Plus, Trash2, GripVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SurveyQuestionDraft, ApiSurveyOption } from "@/lib/api-client";

// ── Helpers ───────────────────────────────────────────────────────────────────

function newOption(): ApiSurveyOption {
  return { id: crypto.randomUUID(), label: "" };
}

function newQuestion(): SurveyQuestionDraft {
  return {
    question_text: "",
    question_type: "text",
    options: [],
    required: false,
  };
}

const TYPE_KEYS = ["text", "single_choice", "multiple_choice"] as const;

// ── Sub-components ────────────────────────────────────────────────────────────

function OptionRow({
  option,
  onChange,
  onRemove,
  removable,
}: {
  option: ApiSurveyOption;
  onChange: (label: string) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <Input
        value={option.label}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("surveyBuilder.optionLabelPlaceholder")}
        className="h-8 text-sm"
      />
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive flex-shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function QuestionCard({
  question,
  index,
  onChange,
  onRemove,
  removable,
}: {
  question: SurveyQuestionDraft;
  index: number;
  onChange: (q: SurveyQuestionDraft) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  const { t } = useTranslation();
  const isChoice = question.question_type !== "text";

  function setField<K extends keyof SurveyQuestionDraft>(key: K, value: SurveyQuestionDraft[K]) {
    onChange({ ...question, [key]: value });
  }

  function setType(type: SurveyQuestionDraft["question_type"]) {
    // Seed two blank options when switching to a choice type for the first time
    const options =
      type !== "text" && question.options.length < 2
        ? [newOption(), newOption()]
        : question.options;
    onChange({ ...question, question_type: type, options });
  }

  function addOption() {
    setField("options", [...question.options, newOption()]);
  }

  function updateOption(id: string, label: string) {
    setField(
      "options",
      question.options.map((o) => (o.id === id ? { ...o, label } : o)),
    );
  }

  function removeOption(id: string) {
    setField(
      "options",
      question.options.filter((o) => o.id !== id),
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <span className="mt-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("surveyBuilder.questionLabel", { number: index + 1 })}
        </span>
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive ml-auto"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Question text */}
      <div className="space-y-1.5">
        <Label className="text-xs">{t("surveyBuilder.question")}</Label>
        <Input
          value={question.question_text}
          onChange={(e) => setField("question_text", e.target.value)}
          placeholder={t("surveyBuilder.questionPlaceholder")}
        />
      </div>

      {/* Type selector */}
      <div className="space-y-1.5">
        <Label className="text-xs">{t("surveyBuilder.answerType")}</Label>
        <Select value={question.question_type} onValueChange={setType}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_KEYS.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`surveyBuilder.type.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Options list (choice types only) */}
      {isChoice && (
        <div className="space-y-2">
          <Label className="text-xs">{t("surveyBuilder.options")}</Label>
          <div className="space-y-1.5">
            {question.options.map((opt) => (
              <OptionRow
                key={opt.id}
                option={opt}
                onChange={(label) => updateOption(opt.id, label)}
                onRemove={() => removeOption(opt.id)}
                removable={question.options.length > 2}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 px-2"
            onClick={addOption}
          >
            <Plus className="h-3 w-3" /> {t("surveyBuilder.addOption")}
          </Button>
        </div>
      )}

      {/* Required toggle */}
      <div className="flex items-center justify-between pt-1">
        <Label className="text-xs text-muted-foreground">{t("surveyBuilder.required")}</Label>
        <Switch checked={question.required} onCheckedChange={(v) => setField("required", v)} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface SurveyBuilderProps {
  /** Survey title */
  title: string;
  onTitleChange: (t: string) => void;
  /** Ordered list of question drafts */
  questions: SurveyQuestionDraft[];
  onQuestionsChange: (qs: SurveyQuestionDraft[]) => void;
}

export function SurveyBuilder({
  title,
  onTitleChange,
  questions,
  onQuestionsChange,
}: SurveyBuilderProps) {
  const { t } = useTranslation();
  function addQuestion() {
    onQuestionsChange([...questions, newQuestion()]);
  }

  function updateQuestion(index: number, q: SurveyQuestionDraft) {
    onQuestionsChange(questions.map((existing, i) => (i === index ? q : existing)));
  }

  function removeQuestion(index: number) {
    onQuestionsChange(questions.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {/* Survey title */}
      <div className="space-y-1.5">
        <Label htmlFor="survey-title">{t("surveyBuilder.surveyTitle")}</Label>
        <Input
          id="survey-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t("eventForm.defaultSurveyTitle")}
        />
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {questions.map((q, i) => (
          <QuestionCard
            key={i}
            index={i}
            question={q}
            onChange={(updated) => updateQuestion(i, updated)}
            onRemove={() => removeQuestion(i)}
            removable={questions.length > 1}
          />
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addQuestion}>
        <Plus className="h-4 w-4" /> {t("surveyBuilder.addQuestion")}
      </Button>
    </div>
  );
}
