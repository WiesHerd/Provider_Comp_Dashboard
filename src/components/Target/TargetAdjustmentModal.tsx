import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { TargetAdjustmentFormData, TargetAdjustment } from '@/types/target-adjustment';
import { createTargetAdjustment, updateTargetAdjustment } from '@/services/target-adjustment';

interface Props {
  show: boolean;
  onHide: () => void;
  onSubmit: (adjustment: TargetAdjustment) => void;
  providerId: string;
  initialData?: TargetAdjustment;
}

export default function TargetAdjustmentModal({ show, onHide, onSubmit, providerId, initialData }: Props) {
  const [formData, setFormData] = useState<TargetAdjustmentFormData>({
    name: '',
    description: '',
    providerId: '',
    year: new Date().getFullYear(),
    monthlyValues: {
      jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
      jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
    }
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        providerId: initialData.providerId,
        year: initialData.year,
        monthlyValues: {
          jan: initialData.jan,
          feb: initialData.feb,
          mar: initialData.mar,
          apr: initialData.apr,
          may: initialData.may,
          jun: initialData.jun,
          jul: initialData.jul,
          aug: initialData.aug,
          sep: initialData.sep,
          oct: initialData.oct,
          nov: initialData.nov,
          dec: initialData.dec
        }
      });
    } else {
      // Reset form when modal is opened for a new adjustment
      setFormData({
        name: '',
        description: '',
        providerId: providerId,
        year: new Date().getFullYear(),
        monthlyValues: {
          jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
          jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
        }
      });
    }
  }, [initialData, providerId, show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = initialData
        ? await updateTargetAdjustment(initialData.id || '', formData)
        : await createTargetAdjustment(formData);
      
      if (response.data) {
        onSubmit(response.data);
        onHide();
      } else {
        console.error('Failed to save target adjustment: No data returned');
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Failed to save target adjustment:', error);
      // TODO: Show error message to user
    }
  };

  const handleMonthlyValueChange = (month: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      monthlyValues: {
        ...prev.monthlyValues,
        [month]: Number(value) || 0
      }
    }));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{initialData ? 'Edit Target Adjustment' : 'Add Target Adjustment'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Year</Form.Label>
            <Form.Control
              type="number"
              value={formData.year}
              onChange={e => setFormData(prev => ({ ...prev, year: Number(e.target.value) }))}
              required
            />
          </Form.Group>
          <div className="row">
            {Object.entries(formData.monthlyValues).map(([month, value]) => (
              <div key={month} className="col-md-2 mb-3">
                <Form.Group>
                  <Form.Label>{month.toUpperCase()}</Form.Label>
                  <Form.Control
                    type="number"
                    value={value}
                    onChange={e => handleMonthlyValueChange(month, e.target.value)}
                  />
                </Form.Group>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {initialData ? 'Update' : 'Add'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
} 