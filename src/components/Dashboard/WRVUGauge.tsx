import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { formatCurrency } from '@/utils/formatters';

interface WRVUGaugeProps {
  title: string;
  value: number;
  subtitle: string;
  size?: 'medium' | 'large';
}

const WRVUGauge: React.FC<WRVUGaugeProps> = ({ title, value, subtitle, size = 'medium' }) => {
  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className={`mx-auto ${size === 'large' ? 'w-48 h-48' : 'w-32 h-32'}`}>
        <CircularProgressbar
          value={value}
          text={`${value.toFixed(1)}%`}
          styles={buildStyles({
            textSize: '16px',
            pathColor: value > 0 ? '#2563EB' : '#94A3B8',
            textColor: '#1F2937',
            trailColor: '#E2E8F0',
            strokeLinecap: 'round',
          })}
        />
      </div>
      <p className="text-gray-600 mt-2">{subtitle}</p>
    </div>
  );
};

export default WRVUGauge; 