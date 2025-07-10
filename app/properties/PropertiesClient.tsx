// app/properties/PropertiesClient.tsx
"use client";
import { useRouter } from "next/navigation";
import Container from "../components/Container";
import Heading from "../components/Heading";
import { SafeSpace, SafeUser } from "../types";
import { useCallback, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import SpaceCard from "../components/spaces/SpaceCard";

interface PropertiesClientProps {
  spaces: SafeSpace[];
  currentUser?: SafeUser | null;
}

const PropertiesClient: React.FC<PropertiesClientProps> = ({
  spaces,
  currentUser,
}) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState("");

  const onDelete = useCallback(
    (id: string) => {
      setDeletingId(id);
      axios
        .delete(`/api/spaces/${id}`)
        .then(() => {
          toast.success("Space deleted");
          router.refresh();
        })
        .catch((error) => {
          toast.error(error?.response?.data?.error);
        })
        .finally(() => {
          setDeletingId("");
        });
    },
    [router]
  );

  return (
    <Container>
      <Heading title="My Spaces" subtitle="List of spaces you've created" />
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
        {spaces.map((space) => (
          <SpaceCard
            key={space.id}
            data={space}
            actionId={space.id}
            onAction={onDelete}
            disabled={deletingId === space.id}
            actionLabel="Delete space"
            currentUser={currentUser}
          />
        ))}
      </div>
    </Container>
  );
};

export default PropertiesClient;
