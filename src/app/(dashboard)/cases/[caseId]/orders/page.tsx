"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Topbar from "@/components/layout/Topbar";
import OrderSheetForm from "@/components/features/hearings/OrderSheetForm";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { useHearings } from "@/hooks/useHearings";
import { useAuth } from "@/hooks/useAuth";
import { useCase } from "@/hooks/useCases";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, ScrollText, Calendar } from "lucide-react";
import type { HearingWithRelations, OrderType } from "@/types/hearing";

export default function CaseOrdersPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { caseData, isLoading: caseLoading } = useCase(caseId);
  const { hearings, isLoading: hearingsLoading } = useHearings(caseId);

  const isLoading = caseLoading || hearingsLoading;
  const isJudge = user?.role === "trial_judge";

  if (isLoading) {
    return (
      <div>
        <Topbar title="Order Sheets" />
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!caseData || !user) return null;

  const hearingsWithOrders = hearings.filter(
    (h: HearingWithRelations) => (h.order_sheets?.length ?? 0) > 0 || isJudge
  );

  const handleSubmitOrder = async (data: {
    hearing_id?: string;
    order_type: OrderType;
    order_text: string;
  }) => {
    if (!data.hearing_id) return { error: "No hearing selected" };
    try {
      const supabase = createClient();
      const { error } = await supabase.from("order_sheets").insert({
        hearing_id: data.hearing_id,
        case_id: caseId,
        order_type: data.order_type,
        order_text: data.order_text,
        issued_by: user.id,
      });
      return { error: error?.message ?? null };
    } catch (err) {
      return { error: String(err) };
    }
  };

  const allOrders = hearings.flatMap((h: HearingWithRelations) =>
    (h.order_sheets ?? []).map((o) => ({ ...o, hearing: h }))
  );

  return (
    <div>
      <Topbar title={`Order Sheets — ${caseData.case_number}`} />
      <div className="p-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/cases/${caseId}`)}
          className="flex items-center gap-1 text-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Case
        </Button>

        {allOrders.length === 0 && !isJudge && (
          <EmptyState
            icon={<ScrollText className="h-12 w-12" />}
            title="No Orders Yet"
            description="Order sheets will appear here as the case progresses through hearings."
          />
        )}

        {/* Existing orders grouped by hearing */}
        {hearings
          .filter((h: HearingWithRelations) => (h.order_sheets?.length ?? 0) > 0)
          .map((hearing: HearingWithRelations) => (
            <Card key={hearing.id} padding="md">
              <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                <Calendar className="h-4 w-4" />
                <span>
                  Hearing #{hearing.hearing_number} —{" "}
                  {formatDate(hearing.scheduled_date)}
                </span>
              </div>
              <OrderSheetForm
                hearingId={hearing.id}
                existingOrders={hearing.order_sheets ?? []}
                isReadOnly={!isJudge}
                onSubmit={handleSubmitOrder}
              />
            </Card>
          ))}

        {/* New order form (judge only — picks from latest hearing) */}
        {isJudge && hearings.length > 0 && (
          <Card padding="md">
            <p className="mb-3 text-sm font-medium text-foreground">
              Add Order for Latest Hearing (#{hearings[hearings.length - 1].hearing_number})
            </p>
            <OrderSheetForm
              hearingId={hearings[hearings.length - 1].id}
              existingOrders={[]}
              isReadOnly={false}
              onSubmit={handleSubmitOrder}
            />
          </Card>
        )}

        {isJudge && hearings.length === 0 && (
          <EmptyState
            icon={<ScrollText className="h-12 w-12" />}
            title="No Hearings Scheduled"
            description="Order sheets can be issued once hearings are scheduled for this case."
          />
        )}
      </div>
    </div>
  );
}
