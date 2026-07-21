import type { TeacherClassRoster } from "@english-learning/contracts/class";
import { teacherClassRosterResponseSchema } from "@english-learning/contracts/class";
import { fetchApi } from "@/lib/api-client";

export const classService = {
  async getMine(): Promise<TeacherClassRoster> {
    const data = await fetchApi("/classes/me");
    return teacherClassRosterResponseSchema.parse(data).class;
  }
};
