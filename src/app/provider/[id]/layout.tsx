export default function ProviderLayout({ 
  children,
  params,
}: { 
  children: React.ReactNode;
  params: { id: string };
}) {
  const { id } = params;
  return (
    <div>
      {children}
    </div>
  );
} 