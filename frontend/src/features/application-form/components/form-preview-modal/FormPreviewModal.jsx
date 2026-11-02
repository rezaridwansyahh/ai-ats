import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FormRenderer from '../form-renderer/FormRenderer.jsx';

export default function FormPreviewModal({ open, onOpenChange, schema }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Form Preview</DialogTitle>
        </DialogHeader>
        <FormRenderer schema={schema} readOnly/>
      </DialogContent>
    </Dialog>
  );
}