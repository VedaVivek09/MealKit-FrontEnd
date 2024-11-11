import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SuggestionFilterPipe } from './pipes/SuggestionFilterPipe';
import { DietaryOptionsPipe } from './pipes/DietaryOptionsPipe';
import { IngredientQualitiesPipe } from './pipes/IngredientQualitiesPipe';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    SuggestionFilterPipe,
    DietaryOptionsPipe,
    IngredientQualitiesPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
