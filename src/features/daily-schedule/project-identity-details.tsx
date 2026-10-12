type ProjectIdentity = {
  customerName: string;
  projectName: string;
  soNo: string;
  jobNo: string;
};

export function ProjectIdentityDetails({
  project,
}: {
  project: ProjectIdentity;
}) {
  const fields = [
    ["Client Name", project.customerName],
    ["Project Name", project.projectName],
    ["SO No.", project.soNo],
    ["Job No.", project.jobNo],
  ] as const;

  return (
    <span className="grid min-w-0 gap-y-1 text-left">
      {fields.map(([label, value]) => (
        <span
          key={label}
          className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-x-2"
        >
          <span className="text-xs leading-5 text-muted-foreground">
            {label}
          </span>
          <span
            className={
              label === "Project Name"
                ? "min-w-0 whitespace-normal font-medium leading-5 text-foreground [overflow-wrap:anywhere]"
                : "min-w-0 whitespace-normal text-sm font-normal leading-5 text-foreground [overflow-wrap:anywhere]"
            }
          >
            {value.trim() || "—"}
          </span>
        </span>
      ))}
    </span>
  );
}
