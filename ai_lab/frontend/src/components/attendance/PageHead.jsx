export default function PageHead({ code, title, sub }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-3">
        <span className="rounded-[5px] bg-[#11473d] px-[7px] py-0.5 font-mono text-[11.5px] text-white">{code}</span>
        <h1 className="font-display text-[26px] font-bold leading-tight">{title}</h1>
      </div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}