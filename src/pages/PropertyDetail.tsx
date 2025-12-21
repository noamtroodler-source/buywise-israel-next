import { useParams } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, Calendar, Phone, Mail } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useProperty } from '@/hooks/useProperties';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: property, isLoading } = useProperty(id || '');

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(currency === 'ILS' ? 'he-IL' : 'en-US', {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return <Layout><div className="container py-8"><Skeleton className="h-96 w-full rounded-xl" /></div></Layout>;
  }

  if (!property) {
    return <Layout><div className="container py-16 text-center"><h1 className="text-2xl font-bold">Property not found</h1></div></Layout>;
  }

  const images = property.images?.length ? property.images : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200'];

  return (
    <Layout>
      <div className="container py-8">
        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <img src={images[0]} alt={property.title} className="w-full h-96 object-cover rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            {images.slice(1, 5).map((img, i) => (
              <img key={i} src={img} alt="" className="w-full h-44 object-cover rounded-lg" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Badge className="mb-2">{property.listing_status === 'for_sale' ? 'For Sale' : 'For Rent'}</Badge>
              <h1 className="text-3xl font-bold text-foreground">{property.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-2">
                <MapPin className="h-4 w-4" />
                <span>{property.address}, {property.city}</span>
              </div>
            </div>

            <div className="text-3xl font-bold text-primary">
              {formatPrice(property.price, property.currency)}
              {property.listing_status === 'for_rent' && <span className="text-lg text-muted-foreground">/month</span>}
            </div>

            <div className="flex gap-6 py-4 border-y border-border">
              <div className="flex items-center gap-2"><Bed className="h-5 w-5 text-muted-foreground" /><span>{property.bedrooms} Beds</span></div>
              <div className="flex items-center gap-2"><Bath className="h-5 w-5 text-muted-foreground" /><span>{property.bathrooms} Baths</span></div>
              {property.size_sqm && <div className="flex items-center gap-2"><Maximize className="h-5 w-5 text-muted-foreground" /><span>{property.size_sqm} m²</span></div>}
              {property.year_built && <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-muted-foreground" /><span>Built {property.year_built}</span></div>}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-muted-foreground">{property.description || 'No description available.'}</p>
            </div>

            {property.features?.length && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Features</h2>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((f, i) => <Badge key={i} variant="secondary">{f}</Badge>)}
                </div>
              </div>
            )}
          </div>

          {/* Agent Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Contact Agent</h3>
              {property.agent ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {property.agent.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{property.agent.name}</p>
                      <p className="text-sm text-muted-foreground">{property.agent.agency_name}</p>
                    </div>
                  </div>
                  <Button className="w-full gap-2"><Phone className="h-4 w-4" /> Call Agent</Button>
                  <Button variant="outline" className="w-full gap-2"><Mail className="h-4 w-4" /> Send Message</Button>
                </div>
              ) : (
                <p className="text-muted-foreground">No agent assigned</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}