interface CompensationTableProps {
  baseMonthlyData: Record<string, number>;
  // ... other props
}

const CompensationTable: React.FC<CompensationTableProps> = ({
  baseMonthlyData,
  // ... other props
}) => {
  return (
    <table>
      {/* ... table headers ... */}
      <tbody>
        {months.map((month) => (
          <tr key={month}>
            <td>{month}</td>
            <td>${baseMonthlyData[month.toLowerCase()].toFixed(2)}</td>
            {/* ... other columns ... */}
          </tr>
        ))}
      </tbody>
    </table>
  );
}; 