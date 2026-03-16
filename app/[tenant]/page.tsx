'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, ClipboardCheck, HeartHandshake, ShieldCheck } from 'lucide-react'
import { InquiryForm } from '@/components/public/inquiry-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTenant } from '@/lib/context/tenant-context'

const SERVICES = [
  {
    title: 'Solo dog walks',
    description: 'Structured neighborhood walks tailored to your dog’s pace, age, and energy level.',
  },
  {
    title: 'Puppy visits',
    description: 'Potty breaks, feeding, and routine-building check-ins for younger dogs.',
  },
  {
    title: 'Vacation drop-ins',
    description: 'Reliable in-home visits with updates, photos, and clear notes after every stop.',
  },
]

const TRUST_POINTS = [
  {
    icon: ClipboardCheck,
    title: 'Simple onboarding',
    description: 'Clients can get started with pet details, a waiver, and booking requests in one place.',
  },
  {
    icon: CalendarDays,
    title: 'Clear scheduling',
    description: 'Request walks without endless text-message back-and-forth.',
  },
  {
    icon: HeartHandshake,
    title: 'Professional updates',
    description: 'Warm, detailed reports after each completed visit help build trust and retention.',
  },
]

export default function TenantPublicPage() {
  const { tenant } = useTenant()
  const isDemo = tenant.slug === 'demo'

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Image
              src="/assets/brand/logo-full-color.png"
              alt="PawPath Pro"
              width={150}
              height={40}
              className="h-10 w-auto"
            />
            <span className="hidden text-sm text-stone-500 sm:inline">powered by PawPath Pro</span>
          </div>
          <Link href={`/${tenant.slug}/portal/login`}>
            <Button variant="outline" size="sm">Client sign in</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
        <div>
          <Badge variant="secondary" className="mb-4">Professional dog walking with a client portal</Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            {tenant.business_name} gives busy pet owners dependable walks and a more organized care routine.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-stone-600">
            {tenant.business_name} helps you keep your dog active and cared for with reliable scheduling,
            easy onboarding, and clear post-visit communication.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#inquiry">
              <Button size="lg" style={{ backgroundColor: tenant.branding_primary_color }}>
                Request a meet-and-greet <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <Link href={`/${tenant.slug}/portal`}>
              <Button variant="outline" size="lg">View client portal</Button>
            </Link>
            {isDemo && (
              <Link href={`/${tenant.slug}/login`}>
                <Button variant="outline" size="lg">Open walker demo</Button>
              </Link>
            )}
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-stone-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" style={{ color: tenant.branding_primary_color }} />
              Digital waiver and intake
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" style={{ color: tenant.branding_primary_color }} />
              Booking requests and approvals
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" style={{ color: tenant.branding_primary_color }} />
              Visit summaries and billing
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden border-stone-200 bg-white">
            <Image
              src="/assets/website/walk-report-header.png"
              alt="Walk report illustration"
              width={1600}
              height={900}
              className="h-auto w-full"
              priority
            />
          </Card>
          <Card className="border-stone-200 bg-stone-900 text-stone-50">
            <CardHeader>
              <CardTitle className="text-2xl">Why clients stay</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-stone-300">
              <p>Owners want reliability, visibility, and a professional experience they can trust.</p>
              <div className="space-y-3">
                <div className="rounded-lg bg-white/10 p-3">
                  Easy first contact and follow-up
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  Centralized pet details and care notes
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  Clean billing flow instead of fragmented payment requests
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {SERVICES.map((service) => (
            <Card key={service.title} className="border-stone-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-stone-600">
                {service.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {TRUST_POINTS.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border-stone-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-5 w-5" style={{ color: tenant.branding_primary_color }} />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-stone-600">
                {description}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <Card className="overflow-hidden border-stone-200 bg-[#f6efe3]">
          <div className="grid gap-6 p-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="overflow-hidden rounded-2xl bg-white p-3 shadow-sm">
              <Image
                src="/assets/brand/mascot-dog.png"
                alt="PawPath mascot dog"
                width={1200}
                height={1200}
                className="h-auto w-full rounded-xl"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Safe, documented, and easy to trust.</h2>
              <p className="mt-3 text-stone-600">
                New clients expect more than a text message and a payment handle. They want clear intake,
                emergency details, waivers, and a professional system from the first meet-and-greet onward.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-700">
                <div className="rounded-full bg-white px-3 py-1">Waiver-ready onboarding</div>
                <div className="rounded-full bg-white px-3 py-1">Pet care notes</div>
                <div className="rounded-full bg-white px-3 py-1">Visit summaries</div>
                <div className="rounded-full bg-white px-3 py-1">Cleaner billing</div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section id="inquiry" className="border-t border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge variant="secondary" className="mb-4">New client inquiry</Badge>
            <h2 className="text-3xl font-bold tracking-tight">Tell us about your dog and your routine.</h2>
            <p className="mt-4 text-stone-600">
              This form feeds directly into the business inbox so the walker can follow up with scheduling,
              pricing, and next steps.
            </p>
          </div>
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Request information</CardTitle>
            </CardHeader>
            <CardContent>
              <InquiryForm tenantId={tenant.id} businessName={tenant.business_name} />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
