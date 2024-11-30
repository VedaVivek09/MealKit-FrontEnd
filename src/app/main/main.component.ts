import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { trigger, transition, style, animate } from '@angular/animations';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface SearchHistoryItem {
  word: string;
  frequency: number;
}

export interface SearchResponse {
  recipes: any[];
  wordCount: number;
  wordFrequencies: { [key: string]: number };
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class MainComponent implements OnInit {
  searchForm: FormGroup;
  requirementsForm: FormGroup;
  mealKitServices: any[] = [];
  filteredServices: any[] = [];
  recommendations: any[] = [];
  spellCheckResults: string[] = [];
  wordCompletions: string[] = [];
  
  wordSuggested: String[] = [];

  frequencyCount: { [key: string]: number } = {};
  searchFrequency: { [key: string]: number } = {};

  searchHistory: SearchHistoryItem[] = [];
  searchWordCount: number = 0;
  scrapedDataFrequencies: { [key: string]: number } = {};

  searchRecipes() {
    const term = this.searchForm.get('searchTerm')?.value;
    
    this.http.post<SearchResponse>(`http://localhost:8080/search/recipes?query=${term}`, {})
      .subscribe(response => {
        this.filteredServices = response.recipes;
        this.searchWordCount = response.wordCount;
        this.scrapedDataFrequencies = response.wordFrequencies;
        this.updateSearchHistory(term);
      });
  }

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.searchForm = this.fb.group({
      searchTerm: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]],
    });

    this.requirementsForm = this.fb.group({
      maxWeeklyCost: [100, [Validators.required, Validators.min(0)]],
      minMealsPerWeek: [3, [Validators.required, Validators.min(1)]],
      minServingsPerMeal: [2, [Validators.required, Validators.min(1)]],
      deliveryFrequency: ['Weekly'],
      dietaryPreferences: this.fb.group({
        vegetarian: [false],
        vegan: [false],
        keto: [false],
        glutenFree: [false],
      }),
      ingredientQualities: this.fb.group({
        organic: [false],
        local: [false],
        sustainable: [false],
      }),
    });
  }

  ngOnInit() {
    // Fetch all data on component initialization
    this.http.get<any[]>('http://localhost:8080/getAllRecipes').subscribe(
      (data) => {
        this.mealKitServices = data;
        this.filteredServices = data; // Initialize with all data
      },
      (error) => {
        console.error('Error fetching data:', error);
      }
    );

    this.searchForm.get('searchTerm')?.valueChanges .pipe(
      debounceTime(800), // Wait for 800ms after typing stops
      distinctUntilChanged() // Ensure the term is different from the last
    ).subscribe((term) => {
      if (term) {
        this.handleSearch(term.trim());
      }
    });

    // Fetch and display search history
    this.fetchSearchHistory();
  }

  handleSearch(term: string) {
    // Validate the search term
    const isValidSearch = /^[a-zA-Z\s]+$/.test(term);
    if (!isValidSearch) {
      console.error('Invalid search term');
      this.filteredServices = [];
      return;
    }

    // Update search history on the backend
    this.updateSearchHistory(term);

    // Call getWordCompletions to retrieve suggestions
    this.getWordCompletions(term);

    this.getSuggestedWord(term);

    // Call backend for recipe search
    this.http.post<any[]>(`http://localhost:8080/search/recipes?query=${term}`, {}).subscribe(
      (data) => {
        this.filteredServices = data;
      },
      (error) => {
        console.error('Error during recipe search:', error);
      }
    );

  }

  // New method to update search history
  updateSearchHistory(term: string) {
  this.http.post('http://localhost:8080/search/updateSearchHistory', { query: term })
    .subscribe({
      next: () => {
        // Refresh search history after updating
        this.fetchSearchHistory();
      },
      error: (err) => {
        console.error('Error updating search history', err);
      }
    });
  }

  // New method to fetch search history
  fetchSearchHistory() {
    this.http.get<{ word: string, frequency: number }[]>('http://localhost:8080/search/searchHistory')
      .subscribe({
        next: (history) => {
          this.searchHistory = this.uniqueByWord(history); // Deduplicate history here
        },
        error: (err) => {
          console.error('Error fetching search history', err);
        }
      });
  }

  uniqueByWord(history: SearchHistoryItem[]): SearchHistoryItem[] {
    const uniqueHistory = new Map<string, SearchHistoryItem>();
    history.forEach(item => uniqueHistory.set(item.word, item));
    return Array.from(uniqueHistory.values());
  }

  getWordCompletions(term: string) {
    this.http.get<string[]>(`http://localhost:8080/search/suggestions?prefix=${term}`).subscribe(
      (data) => {
        this.wordCompletions = data;
      },
      (error) => {
        console.error('Error fetching word completions:', error);
      }
    );
  }

  getSuggestedWord(term: string) {
    this.http.get<string[]>(`http://localhost:8080/search11/suggestedwords?prefix=${term}`).subscribe(
      (data) => {
        this.wordSuggested = data;
      },
      (error) => {
        console.error('Error fetching suggested words:', error);
      }
    );
  }

  generateRecommendations() {
    const requirements = this.requirementsForm.value;
    this.recommendations = this.mealKitServices
      .filter((service) =>
        service.weeklyCost <= requirements.maxWeeklyCost &&
        service.mealsPerWeek >= requirements.minMealsPerWeek &&
        service.servingsPerMeal >= requirements.minServingsPerMeal &&
        service.deliveryFrequency === requirements.deliveryFrequency &&
        (!requirements.dietaryPreferences.vegetarian || service.vegetarian) &&
        (!requirements.dietaryPreferences.vegan || service.vegan) &&
        (!requirements.dietaryPreferences.keto || service.keto) &&
        (!requirements.dietaryPreferences.glutenFree || service.glutenFree) &&
        (!requirements.ingredientQualities.organic || service.organic) &&
        (!requirements.ingredientQualities.local || service.local) &&
        (!requirements.ingredientQualities.sustainable || service.sustainable)
      )
      .sort((a, b) => {
        const aScore =
          Object.values(requirements.dietaryPreferences).filter(Boolean).length +
          Object.values(requirements.ingredientQualities).filter(Boolean).length;
        const bScore =
          Object.values(requirements.dietaryPreferences).filter(Boolean).length +
          Object.values(requirements.ingredientQualities).filter(Boolean).length;
        return bScore - aScore;
      });

    // Combine search and recommendations for display
    this.filteredServices = this.recommendations;
  }
}
