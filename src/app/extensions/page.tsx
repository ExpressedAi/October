"use client";

import React, { useState } from 'react';
import { ArrowLeft, Settings, Globe, Database, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { FirecrawlSettings } from '@/components/firecrawl-settings';

const extensions = [
  {
    id: 'firecrawl',
    name: 'Firecrawl Web Scraping',
    description: 'Advanced web scraping and content extraction. Perfect for deep-diving into specific websites and documents.',
    icon: Globe,
    status: 'available',
    category: 'Web Scraping',
    features: ['Recursive crawling', 'Content extraction', 'Rate limiting', 'JS rendering']
  },
  {
    id: 'database',
    name: 'Database Tools',
    description: 'Connect and query various databases directly from your agent conversations.',
    icon: Database,
    status: 'coming-soon',
    category: 'Data',
    features: ['SQL queries', 'NoSQL support', 'Connection pooling', 'Schema analysis']
  },
  {
    id: 'automation',
    name: 'Automation Suite',
    description: 'Automate workflows, trigger actions, and integrate with external services.',
    icon: Zap,
    status: 'coming-soon',
    category: 'Automation',
    features: ['Workflow triggers', 'API integrations', 'Scheduled tasks', 'Event handling']
  }
];

export default function ExtensionsPage() {
  const [selectedExtension, setSelectedExtension] = useState<string | null>(null);

  if (selectedExtension === 'firecrawl') {
    return (
      <FirecrawlSettings onBack={() => setSelectedExtension(null)} />
    );
  }

  return (
    <div className="h-full bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-6">
          <Link href="/" className="mr-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chat
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Extensions</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-8">
          <p className="text-muted-foreground text-lg">
            Extend your agent's capabilities with powerful integrations and tools.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {extensions.map((extension) => (
            <Card 
              key={extension.id} 
              className="relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer"
              onClick={() => extension.status === 'available' && setSelectedExtension(extension.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <extension.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{extension.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {extension.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {extension.status === 'available' && (
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    )}
                    {extension.status === 'coming-soon' && (
                      <Badge variant="secondary">Coming Soon</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <CardDescription className="text-base mb-4">
                  {extension.description}
                </CardDescription>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Key Features:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {extension.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}