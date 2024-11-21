import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { trigger, transition, style, animate } from '@angular/animations';

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

    this.searchForm.get('searchTerm')?.valueChanges.subscribe((term) => {
      if (term) {
        this.handleSearch(term);
      }
    });
  }

  handleSearch(term: string) {
    // Validate the search term
    const isValidSearch = /^[a-zA-Z\s]+$/.test(term);
    if (!isValidSearch) {
      console.error('Invalid search term');
      this.filteredServices = [];
      return;
    }

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

    // Frequency count and search history updates
    const words = term.toLowerCase().split(/\s+/);
    this.frequencyCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    words.forEach((word) => {
      this.searchFrequency[word] = (this.searchFrequency[word] || 0) + 1;
    });
  }

  searchRecipes() {
    const term = this.searchForm.get('searchTerm')?.value;
    this.http.post<any[]>(`http://localhost:8080/search/recipes?query=${term}`, {}).subscribe(
      (data) => {
        this.filteredServices = data;
      },
      (error) => {
        console.error('Error during search:', error);
      }
    );
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
