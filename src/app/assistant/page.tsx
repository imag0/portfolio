import type { Metadata } from "next";
import { AssistantClient } from "./AssistantClient";

export const metadata: Metadata = {
  title: "Asystent Praktyki Morskiej",
  description: "Live task, evidence and file upload assistant for an oil tanker practice report.",
};

export default function AssistantPage() {
  return <AssistantClient />;
}
