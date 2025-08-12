"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArticleLibrary } from '@/components/articles/ArticleLibrary';
import { ArticleCreator } from '@/components/articles/ArticleCreator';
import { ArticleEditor } from '@/components/articles/ArticleEditor';
import { initArticleDB, getAllArticles } from '@/lib/article-db';
import type { Article } from '@/lib/article-types';

type View = 'library' | 'creator' | 'editor';

export default function ArticlesPage() {
  const [view, setView] = useState<View>('library');
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentArticleId, setCurrentArticleId] = useState<number | null>(null);
  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = useCallback(async () => {
    if (!isDbReady) return;
    try {
      const allArticles = await getAllArticles();
      setArticles(allArticles);
    } catch (err) {
      console.error("Failed to load articles", err);
      setError("Could not load articles from the database.");
    }
  }, [isDbReady]);

  useEffect(() => {
    initArticleDB().then(() => {
      setIsDbReady(true);
    }).catch(err => {
      console.error("Failed to initialize DB", err);
      setError("Your browser doesn't support the local database needed for this app.");
    });
  }, []);

  useEffect(() => {
    if (isDbReady) {
      loadArticles();
    }
  }, [isDbReady, loadArticles]);

  const handleNewArticle = () => {
    setView('creator');
  };

  const handleArticleCreated = (id: number) => {
    loadArticles();
    setCurrentArticleId(id);
    setView('editor');
  };

  const handleSelectArticle = (id: number) => {
    setCurrentArticleId(id);
    setView('editor');
  };

  const handleBackToLibrary = () => {
    setCurrentArticleId(null);
    setView('library');
    loadArticles();
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-full p-8 text-red-500">
          <p>{error}</p>
        </div>
      );
    }

    if (!isDbReady) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="ml-4">Initializing article database...</p>
        </div>
      );
    }

    switch (view) {
      case 'creator':
        return <ArticleCreator onArticleCreated={handleArticleCreated} />;
      case 'editor':
        if (currentArticleId) {
          return <ArticleEditor articleId={currentArticleId} onBack={handleBackToLibrary} />;
        }
        setView('library');
        return null;
      case 'library':
      default:
        return (
          <ArticleLibrary
            articles={articles}
            onNewArticle={handleNewArticle}
            onSelectArticle={handleSelectArticle}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Chat
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600">
                  Article Designer
                </h1>
                <p className="text-muted-foreground text-sm">
                  Create stunning articles with AI-generated content and images
                </p>
              </div>
            </div>
            {view !== 'library' && (
              <Button onClick={handleBackToLibrary} variant="outline">
                Back to Library
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
}