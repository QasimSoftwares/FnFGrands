"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useGrants } from "@/contexts/grant-context";
import { GrantEntryForm } from "@/components/grants/grant-entry-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function EditGrantPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getGrantById, loading } = useGrants();

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  const grant = getGrantById(id as string);

  if (loading && !grant) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="animate-spin mr-2">🔄</span>
        Loading grant details...
      </div>
    );
  }

  if (!grant) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Grant Not Found</h1>
        <p className="text-muted-foreground mb-6">The grant you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button asChild>
          <Link href="/grants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Grants
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="outline" asChild className="mb-6">
        <Link href={`/grants/${id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel Edit
        </Link>
      </Button>
      <h1 className="text-3xl font-bold mb-6">Edit Grant Application</h1>
      <GrantEntryForm grant={grant} isEditing={true} onSuccess={() => router.push(`/grants/${id}`)} />
    </div>
  );
}
