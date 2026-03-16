import { useState } from 'react';
import {
  CheckCircle2, XCircle, AlertTriangle, ExternalLink, ChevronDown, ChevronUp, Edit2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ImportJobItem } from '@/hooks/useImportListings';

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score == null) return null;
  const color = score >= 80 ? 'bg-green-500/10 text-green-600 border-green-500/20'
    : score >= 40 ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
    : 'bg-red-500/10 text-red-500 border-red-500/20';
  return (
    <Badge variant="outline" className={cn('text-xs', color)}>
      {score}/100
    </Badge>
  );
}

interface ImportReviewCardProps {
  item: ImportJobItem;
  isExpanded: boolean;
  onToggle: () => void;
  onApprove: (editedData?: any) => void;
  isApproving: boolean;
}

export function ImportReviewCard({ item, isExpanded, onToggle, onApprove, isApproving }: ImportReviewCardProps) {
  const data = item.extracted_data || {};
  const confidence = item.confidence_score ?? data.confidence_score ?? null;
  const warnings = data.validation_warnings || [];
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);

  const statusIcon = item.status === 'done'
    ? <CheckCircle2 className="h-4 w-4 text-green-600" />
    : item.status === 'failed' || item.status === 'skipped'
    ? <XCircle className="h-4 w-4 text-red-500" />
    : <AlertTriangle className="h-4 w-4 text-yellow-600" />;

  const statusLabel = item.status === 'done' ? 'Approved'
    : item.status === 'skipped' ? 'Skipped'
    : item.status === 'failed' ? 'Failed'
    : 'Pending';

  const handleSaveAndApprove = () => {
    onApprove(editData);
    setIsEditing(false);
  };

  return (
    <Card className="rounded-2xl border-primary/10 overflow-hidden">
      {/* Summary Row */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
      >
        {statusIcon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {data.title || data.address || item.url}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {data.city && <span>{data.city}</span>}
            {data.bedrooms != null && <span> · {data.bedrooms} bed</span>}
            {data.size_sqm && <span> · {data.size_sqm}m²</span>}
            {data.price > 0 && <span> · ₪{data.price?.toLocaleString()}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ConfidenceBadge score={confidence} />
          <Badge variant="outline" className="text-xs">{statusLabel}</Badge>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded Detail */}
      {isExpanded && (
        <CardContent className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Source Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">Source</h4>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                {item.url}
              </a>

              {item.error_message && (
                <div className="p-3 rounded-lg bg-destructive/10 text-sm text-destructive">
                  {item.error_message}
                </div>
              )}

              {warnings.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-yellow-600">Warnings:</p>
                  {warnings.map((w: string, i: number) => (
                    <p key={i} className="text-xs text-yellow-600/80 flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                      {w}
                    </p>
                  ))}
                </div>
              )}

              {/* Raw JSON Preview */}
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Raw extracted data
                </summary>
                <pre className="mt-2 p-3 rounded-lg bg-muted/50 overflow-auto max-h-60 text-xs">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </details>
            </div>

            {/* Right: Parsed Data / Edit Form */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-muted-foreground">Parsed Data</h4>
                {item.status === 'pending' && !isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="rounded-lg text-xs">
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  {[
                    { key: 'title', label: 'Title' },
                    { key: 'address', label: 'Address' },
                    { key: 'city', label: 'City' },
                    { key: 'neighborhood', label: 'Neighborhood' },
                    { key: 'price', label: 'Price', type: 'number' },
                    { key: 'bedrooms', label: 'Bedrooms', type: 'number' },
                    { key: 'bathrooms', label: 'Bathrooms', type: 'number' },
                    { key: 'size_sqm', label: 'Size (m²)', type: 'number' },
                    { key: 'floor', label: 'Floor', type: 'number' },
                    { key: 'property_type', label: 'Property Type' },
                  ].map(field => (
                    <div key={field.key} className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground w-24 shrink-0">{field.label}</label>
                      <Input
                        className="h-8 text-sm rounded-lg"
                        type={field.type || 'text'}
                        value={editData[field.key] ?? ''}
                        onChange={e => setEditData({
                          ...editData,
                          [field.key]: field.type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value,
                        })}
                      />
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="rounded-lg" onClick={handleSaveAndApprove} disabled={isApproving}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Save & Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => { setIsEditing(false); setEditData(data); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { label: 'Title', value: data.title },
                    { label: 'City', value: data.city },
                    { label: 'Address', value: data.address },
                    { label: 'Neighborhood', value: data.neighborhood },
                    { label: 'Price', value: data.price ? `₪${data.price.toLocaleString()}` : 'N/A' },
                    { label: 'Bedrooms', value: data.bedrooms },
                    { label: 'Bathrooms', value: data.bathrooms },
                    { label: 'Size', value: data.size_sqm ? `${data.size_sqm}m²` : null },
                    { label: 'Floor', value: data.floor },
                    { label: 'Type', value: data.property_type },
                    { label: 'Status', value: data.listing_status },
                    { label: 'Condition', value: data.condition },
                    { label: 'Photos', value: data.image_urls?.length || 0 },
                  ].filter(f => f.value != null && f.value !== '').map(field => (
                    <div key={field.label}>
                      <p className="text-xs text-muted-foreground">{field.label}</p>
                      <p className="font-medium">{field.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              {item.status === 'pending' && !isEditing && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="rounded-lg" onClick={() => onApprove()} disabled={isApproving}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
