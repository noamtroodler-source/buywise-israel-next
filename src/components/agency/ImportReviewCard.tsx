import { useState } from 'react';
import {
  CheckCircle2, XCircle, AlertTriangle, ExternalLink, ChevronDown, ChevronUp, Edit2, Eye, SkipForward,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FieldConfidenceDot, getFieldConfidence } from './FieldConfidenceDot';
import { PhotoGrid } from './PhotoGrid';
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
  onSkip?: () => void;
  isApproving: boolean;
  isSkipping?: boolean;
}

export function ImportReviewCard({ item, isExpanded, onToggle, onApprove, onSkip, isApproving, isSkipping }: ImportReviewCardProps) {
  const data = item.extracted_data || {};
  const confidence = item.confidence_score ?? data.confidence_score ?? null;
  const warnings = data.validation_warnings || [];
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [showSourcePreview, setShowSourcePreview] = useState(false);

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

  const parsedFields = [
    { key: 'title', label: 'Title', value: data.title },
    { key: 'city', label: 'City', value: data.city },
    { key: 'address', label: 'Address', value: data.address },
    { key: 'neighborhood', label: 'Neighborhood', value: data.neighborhood },
    { key: 'price', label: 'Price', value: data.price ? `₪${data.price.toLocaleString()}` : null, rawValue: data.price },
    { key: 'bedrooms', label: 'Bedrooms', value: data.bedrooms, rawValue: data.bedrooms },
    { key: 'bathrooms', label: 'Bathrooms', value: data.bathrooms, rawValue: data.bathrooms },
    { key: 'size_sqm', label: 'Size', value: data.size_sqm ? `${data.size_sqm}m²` : null, rawValue: data.size_sqm },
    { key: 'floor', label: 'Floor', value: data.floor },
    { key: 'property_type', label: 'Type', value: data.property_type },
    { key: 'listing_status', label: 'Status', value: data.listing_status },
    { key: 'condition', label: 'Condition', value: data.condition },
    { key: 'Photos', label: 'Photos', value: data.image_urls?.length || 0, rawValue: data.image_urls?.length || 0 },
  ];

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
              <div className="flex items-center gap-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1 min-w-0 truncate"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{item.url}</span>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs rounded-lg"
                  onClick={() => setShowSourcePreview(!showSourcePreview)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {showSourcePreview ? 'Hide' : 'Preview'}
                </Button>
              </div>

              {showSourcePreview && (
                <div className="rounded-lg border overflow-hidden bg-background" style={{ height: 300 }}>
                  <iframe
                    src={item.url}
                    title="Source preview"
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full h-full"
                    loading="lazy"
                  />
                </div>
              )}

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

              {data.cross_source_match_id && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
                  <AlertTriangle className="h-3.5 w-3.5 inline mr-1.5 text-yellow-600" />
                  <span className="text-yellow-700 font-medium">Cross-source duplicate detected</span>
                  <p className="text-xs text-yellow-600/80 mt-1">
                    This listing may already exist under a different agent (property ID: {data.cross_source_match_id}).
                  </p>
                </div>
              )}

              {/* Photo Gallery */}
              {data.image_urls && data.image_urls.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    Photos ({data.image_urls.length})
                  </h4>
                  <PhotoGrid
                    imageUrls={isEditing ? editData.image_urls || [] : data.image_urls}
                    editable={isEditing}
                    onChange={(urls) => setEditData({ ...editData, image_urls: urls })}
                  />
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
                      <FieldConfidenceDot level={getFieldConfidence(field.key, editData[field.key], editData)} />
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
                  {parsedFields
                    .filter(f => f.value != null && f.value !== '')
                    .map(field => (
                      <div key={field.label} className="flex items-start gap-1.5">
                        <FieldConfidenceDot level={getFieldConfidence(field.key, field.rawValue ?? field.value, data)} />
                        <div>
                          <p className="text-xs text-muted-foreground">{field.label}</p>
                          <p className="font-medium">{field.value}</p>
                        </div>
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
                  {onSkip && (
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={onSkip} disabled={isSkipping}>
                      <SkipForward className="h-3 w-3 mr-1" />
                      Skip
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
