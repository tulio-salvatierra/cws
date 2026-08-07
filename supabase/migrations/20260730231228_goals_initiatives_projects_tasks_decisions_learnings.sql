-- Captured from staging remote migration history version 20260730231228
-- (goals_initiatives_projects_tasks_decisions_learnings).
-- Already applied on cws-os-staging; this file aligns local CLI history.
-- Source: supabase db dump --linked --schema public

CREATE TABLE IF NOT EXISTS "public"."goals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "goals_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'at_risk'::"text", 'paused'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "goals_title_check" CHECK ((("title" = "btrim"("title")) AND (("char_length"("title") >= 1) AND ("char_length"("title") <= 200))))
);

CREATE TABLE IF NOT EXISTS "public"."initiatives" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'idea'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "initiatives_status_check" CHECK (("status" = ANY (ARRAY['idea'::"text", 'planned'::"text", 'active'::"text", 'blocked'::"text", 'paused'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "initiatives_title_check" CHECK ((("title" = "btrim"("title")) AND (("char_length"("title") >= 1) AND ("char_length"("title") <= 200))))
);

CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "initiative_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'idea'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "projects_status_check" CHECK (("status" = ANY (ARRAY['idea'::"text", 'planned'::"text", 'active'::"text", 'blocked'::"text", 'review'::"text", 'completed'::"text", 'archived'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "projects_title_check" CHECK ((("title" = "btrim"("title")) AND (("char_length"("title") >= 1) AND ("char_length"("title") <= 200))))
);

CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "campaign_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'todo'::"text" NOT NULL,
    "priority" integer DEFAULT 3 NOT NULL,
    "due_date" "date",
    "source_agent_run_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tasks_priority_check" CHECK ((("priority" >= 1) AND ("priority" <= 5))),
    CONSTRAINT "tasks_status_check" CHECK (("status" = ANY (ARRAY['todo'::"text", 'in_progress'::"text", 'blocked'::"text", 'review'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "tasks_title_check" CHECK ((("title" = "btrim"("title")) AND (("char_length"("title") >= 1) AND ("char_length"("title") <= 200))))
);

CREATE TABLE IF NOT EXISTS "public"."decisions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "context" "text",
    "decision" "text" NOT NULL,
    "status" "text" DEFAULT 'proposed'::"text" NOT NULL,
    "superseded_by" "uuid",
    "source_agent_run_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "decisions_status_check" CHECK (("status" = ANY (ARRAY['proposed'::"text", 'approved'::"text", 'superseded'::"text", 'reversed'::"text", 'archived'::"text"]))),
    CONSTRAINT "decisions_title_check" CHECK ((("title" = "btrim"("title")) AND (("char_length"("title") >= 1) AND ("char_length"("title") <= 200))))
);

CREATE TABLE IF NOT EXISTS "public"."learnings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "category" "text",
    "source_agent_run_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "learnings_title_check" CHECK ((("title" = "btrim"("title")) AND (("char_length"("title") >= 1) AND ("char_length"("title") <= 200))))
);

ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."initiatives"
    ADD CONSTRAINT "initiatives_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."decisions"
    ADD CONSTRAINT "decisions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."learnings"
    ADD CONSTRAINT "learnings_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id");

ALTER TABLE ONLY "public"."initiatives"
    ADD CONSTRAINT "initiatives_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."initiatives"
    ADD CONSTRAINT "initiatives_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id");

ALTER TABLE ONLY "public"."initiatives"
    ADD CONSTRAINT "initiatives_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id");

ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_initiative_id_fkey" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("id");

ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id");

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id");

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_source_agent_run_id_fkey" FOREIGN KEY ("source_agent_run_id") REFERENCES "public"."agent_runs"("id");

ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id");

ALTER TABLE ONLY "public"."decisions"
    ADD CONSTRAINT "decisions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."decisions"
    ADD CONSTRAINT "decisions_source_agent_run_id_fkey" FOREIGN KEY ("source_agent_run_id") REFERENCES "public"."agent_runs"("id");

ALTER TABLE ONLY "public"."decisions"
    ADD CONSTRAINT "decisions_superseded_by_fkey" FOREIGN KEY ("superseded_by") REFERENCES "public"."decisions"("id");

ALTER TABLE ONLY "public"."decisions"
    ADD CONSTRAINT "decisions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id");

ALTER TABLE ONLY "public"."learnings"
    ADD CONSTRAINT "learnings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."learnings"
    ADD CONSTRAINT "learnings_source_agent_run_id_fkey" FOREIGN KEY ("source_agent_run_id") REFERENCES "public"."agent_runs"("id");

ALTER TABLE ONLY "public"."learnings"
    ADD CONSTRAINT "learnings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id");

CREATE INDEX "goals_workspace_id_idx" ON "public"."goals" USING "btree" ("workspace_id");

CREATE INDEX "initiatives_goal_id_idx" ON "public"."initiatives" USING "btree" ("goal_id");

CREATE INDEX "initiatives_workspace_id_idx" ON "public"."initiatives" USING "btree" ("workspace_id");

CREATE INDEX "projects_initiative_id_idx" ON "public"."projects" USING "btree" ("initiative_id");

CREATE INDEX "projects_workspace_id_idx" ON "public"."projects" USING "btree" ("workspace_id");

CREATE INDEX "tasks_campaign_id_idx" ON "public"."tasks" USING "btree" ("campaign_id");

CREATE INDEX "tasks_project_id_idx" ON "public"."tasks" USING "btree" ("project_id");

CREATE INDEX "tasks_status_idx" ON "public"."tasks" USING "btree" ("workspace_id", "status");

CREATE INDEX "tasks_workspace_id_idx" ON "public"."tasks" USING "btree" ("workspace_id");

CREATE INDEX "decisions_workspace_id_idx" ON "public"."decisions" USING "btree" ("workspace_id");

CREATE INDEX "learnings_workspace_id_idx" ON "public"."learnings" USING "btree" ("workspace_id");

ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."initiatives" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."decisions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."learnings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_can_add_goals" ON "public"."goals" FOR INSERT WITH CHECK ((( SELECT "public"."is_workspace_member"("goals"."workspace_id") AS "is_workspace_member") AND ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));

CREATE POLICY "workspace_members_can_delete_goals" ON "public"."goals" FOR DELETE USING (( SELECT "public"."is_workspace_member"("goals"."workspace_id") AS "is_workspace_member"));

CREATE POLICY "workspace_members_can_read_goals" ON "public"."goals" FOR SELECT USING (( SELECT "public"."is_workspace_member"("goals"."workspace_id") AS "is_workspace_member"));

CREATE POLICY "workspace_members_can_update_goals" ON "public"."goals" FOR UPDATE USING (( SELECT "public"."is_workspace_member"("goals"."workspace_id") AS "is_workspace_member")) WITH CHECK (( SELECT "public"."is_workspace_member"("goals"."workspace_id") AS "is_workspace_member"));

CREATE POLICY "workspace_members_can_add_initiatives" ON "public"."initiatives" FOR INSERT WITH CHECK ((( SELECT "public"."is_workspace_member"("initiatives"."workspace_id") AS "is_workspace_member") AND ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));

CREATE POLICY "workspace_members_can_delete_initiatives" ON "public"."initiatives" FOR DELETE USING (( SELECT "public"."is_workspace_member"("initiatives"."workspace_id") AS "is_workspace_member"));

CREATE POLICY "workspace_members_can_read_initiatives" ON "public"."initiatives" FOR SELECT USING (( SELECT "public"."is_workspace_member"("initiatives"."workspace_id") AS "is_workspace_member"));

CREATE POLICY "workspace_members_can_update_initiatives" ON "public"."initiatives" FOR UPDATE USING (( SELECT "public"."is_workspace_member"("initiatives"."workspace_id") AS "is_workspace_member")) WITH CHECK (( SELECT "public"."is_workspace_member"("initiatives"."workspace_id") AS "is_workspace_member"));

CREATE POLICY "workspace_members_can_add_projects" ON "public"."projects" FOR INSERT WITH CHECK ((( SELECT "public"."is_workspace_member"("projects"."workspace_id") AS "is_workspace_member") AND ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));

CREATE POLICY "workspace_members_can_delete_projects" ON "public"."projects" FOR DELETE USING (( SELECT "public"."is_workspace_member"("projects"."workspace_id") AS "is_workspace_member"));

CREATE POLICY "workspace_members_can_read_projects" ON "public"."projects" FOR SELECT USING (( SELECT "public"."is_workspace_member"("projects"."workspace_id") AS "is_workspace_member"));

CREATE POLICY "workspace_members_can_update_projects" ON "public"."projects" FOR UPDATE USING (( SELECT "public"."is_workspace_member"("projects"."workspace_id") AS "is_workspace_member")) WITH CHECK (( SELECT "public"."is_workspace_member"("projects"."workspace_id") AS "is_workspace_member"));

CREATE POLICY "workspace_members_can_add_tasks" ON "public"."tasks" FOR INSERT WITH CHECK ((( SELECT "public"."is_workspace_member"("tasks"."workspace_id") AS "is_workspace_member") AND ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));

CREATE POLICY "workspace_members_can_delete_tasks" ON "public"."tasks" FOR DELETE USING (( SELECT "public"."is_workspace_member"("tasks"."workspace_id") AS "is_workspace_member"));

CREATE POLICY "workspace_members_can_read_tasks" ON "public"."tasks" FOR SELECT USING (( SELECT "public"."is_workspace_member"("tasks"."workspace_id") AS "is_workspace_member"));

CREATE POLICY "workspace_members_can_update_tasks" ON "public"."tasks" FOR UPDATE USING (( SELECT "public"."is_workspace_member"("tasks"."workspace_id") AS "is_workspace_member")) WITH CHECK (( SELECT "public"."is_workspace_member"("tasks"."workspace_id") AS "is_workspace_member"));

CREATE POLICY "workspace_members_can_add_decisions" ON "public"."decisions" FOR INSERT WITH CHECK ((( SELECT "public"."is_workspace_member"("decisions"."workspace_id") AS "is_workspace_member") AND ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));

CREATE POLICY "workspace_members_can_delete_decisions" ON "public"."decisions" FOR DELETE USING (( SELECT "public"."is_workspace_member"("decisions"."workspace_id") AS "is_workspace_member"));

CREATE POLICY "workspace_members_can_read_decisions" ON "public"."decisions" FOR SELECT USING (( SELECT "public"."is_workspace_member"("decisions"."workspace_id") AS "is_workspace_member"));

CREATE POLICY "workspace_members_can_update_decisions" ON "public"."decisions" FOR UPDATE USING (( SELECT "public"."is_workspace_member"("decisions"."workspace_id") AS "is_workspace_member")) WITH CHECK (( SELECT "public"."is_workspace_member"("decisions"."workspace_id") AS "is_workspace_member"));

CREATE POLICY "workspace_members_can_add_learnings" ON "public"."learnings" FOR INSERT WITH CHECK ((( SELECT "public"."is_workspace_member"("learnings"."workspace_id") AS "is_workspace_member") AND ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));

CREATE POLICY "workspace_members_can_delete_learnings" ON "public"."learnings" FOR DELETE USING (( SELECT "public"."is_workspace_member"("learnings"."workspace_id") AS "is_workspace_member"));

CREATE POLICY "workspace_members_can_read_learnings" ON "public"."learnings" FOR SELECT USING (( SELECT "public"."is_workspace_member"("learnings"."workspace_id") AS "is_workspace_member"));

CREATE POLICY "workspace_members_can_update_learnings" ON "public"."learnings" FOR UPDATE USING (( SELECT "public"."is_workspace_member"("learnings"."workspace_id") AS "is_workspace_member")) WITH CHECK (( SELECT "public"."is_workspace_member"("learnings"."workspace_id") AS "is_workspace_member"));

CREATE OR REPLACE TRIGGER "goals_updated_at" BEFORE UPDATE ON "public"."goals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();

CREATE OR REPLACE TRIGGER "initiatives_updated_at" BEFORE UPDATE ON "public"."initiatives" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();

CREATE OR REPLACE TRIGGER "projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();

CREATE OR REPLACE TRIGGER "tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();

CREATE OR REPLACE TRIGGER "decisions_updated_at" BEFORE UPDATE ON "public"."decisions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();

CREATE OR REPLACE TRIGGER "learnings_updated_at" BEFORE UPDATE ON "public"."learnings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();

GRANT ALL ON TABLE "public"."goals" TO "anon";

GRANT ALL ON TABLE "public"."goals" TO "authenticated";

GRANT ALL ON TABLE "public"."goals" TO "service_role";

GRANT ALL ON TABLE "public"."initiatives" TO "anon";

GRANT ALL ON TABLE "public"."initiatives" TO "authenticated";

GRANT ALL ON TABLE "public"."initiatives" TO "service_role";

GRANT ALL ON TABLE "public"."projects" TO "anon";

GRANT ALL ON TABLE "public"."projects" TO "authenticated";

GRANT ALL ON TABLE "public"."projects" TO "service_role";

GRANT ALL ON TABLE "public"."tasks" TO "anon";

GRANT ALL ON TABLE "public"."tasks" TO "authenticated";

GRANT ALL ON TABLE "public"."tasks" TO "service_role";

GRANT ALL ON TABLE "public"."decisions" TO "anon";

GRANT ALL ON TABLE "public"."decisions" TO "authenticated";

GRANT ALL ON TABLE "public"."decisions" TO "service_role";

GRANT ALL ON TABLE "public"."learnings" TO "anon";

GRANT ALL ON TABLE "public"."learnings" TO "authenticated";

GRANT ALL ON TABLE "public"."learnings" TO "service_role";
