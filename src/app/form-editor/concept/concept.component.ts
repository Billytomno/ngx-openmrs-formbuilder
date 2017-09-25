import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {ConceptService} from '../../Services/concept.service';
import {DialogService} from "ng2-bootstrap-modal";
import {AnswersComponent} from "../../modals/answers-modal/answers.modal";
import { FormGroup,FormBuilder,FormControl } from '@angular/forms';
import {ConceptsModalComponent} from '../../modals/concept.modal';
import {ElementEditorService} from '../../Services/element-editor.service';
import * as _ from 'lodash';
import {Subscription} from 'rxjs/Subscription';
@Component({
  selector: 'app-concept',
  templateUrl: './concept.component.html',
  styleUrls: ['./concept.component.css']
})
export class ConceptComponent implements OnInit{
private subscription:Subscription;
@Input() question:any; 
@Input() form:FormGroup;
@Output() answers = new EventEmitter<any>();
searching:boolean=false;

searchResult:any;
allAvailableAnswers:Array<any>; //after search result
previousSelectedAnswersIndexes:number[] = [];


  constructor(private cs:ConceptService,private dialogService:DialogService,private fb:FormBuilder,private el:ElementEditorService) { }

  ngOnInit() {
    this.el.reselectAnswers().subscribe((res) => {
      
      if(this.allAvailableAnswers!=undefined) {
        
        this.findIndexesOfPreviouslySelectedAnswers(res,this.allAvailableAnswers);
        this.showAnswersDialog(this.allAvailableAnswers);
      }
      else {
        this.getAnswers(this.form.controls[this.question.key].value);
      }
      
    });
  }


  searchConcept(){
    let conceptID = this.form.controls[this.question.key].value;
    this.searching = true;

    if(!_.isEmpty(conceptID)){
    if(conceptID.length==36&&conceptID.indexOf(' ')==-1){ //searching with concept uuid
      this.subscription = this.cs.searchConceptByUUID(conceptID).subscribe((res) =>{
        this.searching = false;
        let arr = [];
        arr.push(res);
        this.showConceptsDialog(arr);
      });
      
}

else{

  this.subscription = this.cs.searchConcept(conceptID).subscribe(res => {
    this.searchResult = res;
    this.searching = false;
    if(this.searchResult.results){
      this.showConceptsDialog(res.results);
    }
  });
}
}}

getAnswers(conceptID){

  this.cs.searchConceptByUUID(conceptID).subscribe(
    res => {
     
    if(res.answers&&res.answers.length > 0) {
      this.allAvailableAnswers = res.answers;
      this.showAnswersDialog(this.allAvailableAnswers);
}

else{
this.setSelectedAnswers([]);
}});

}

showConceptsDialog(searchResults){
   this.dialogService.addDialog(ConceptsModalComponent, {
     concepts:searchResults
    }, { backdropColor: 'rgba(255, 255, 255, 0.5)' })
     .subscribe((formValue)=>{
       if(formValue){
         this.setFormControlValue(formValue);
         this.getAnswers(formValue['concept']);
   }});
  }



  showAnswersDialog(results){
     this.dialogService.addDialog(AnswersComponent, {
      answers:results
     }, { backdropColor: 'rgba(255, 255, 255, 0.5)' })
      .subscribe((formValue)=>{
        if(formValue)
          this.setSelectedAnswers(formValue)
      });
  }

  setSelectedAnswers(obj){
   let answers = []
   
   if(obj.length>0){
    let jsobj = JSON.parse(obj);
    for(var answer in jsobj ){
     let label = jsobj[answer].slice(0,jsobj[answer].indexOf(','))
     let concept = jsobj[answer].slice(jsobj[answer].indexOf(',')+1)
     let temp = {"label":label,"concept":concept}
     answers.push(temp)
 }
   }
 
    this.answers.emit(answers);
  }

  
  setFormControlValue(formValue){
    this.form.controls['questionOptions.concept'].setValue(formValue.concept)
  }

  keyDownFunction($event){
    if($event.keyCode==13&&this.form.controls[this.question.key].value!='')
        this.searchConcept();
  }

  findIndexesOfPreviouslySelectedAnswers(previouslySelectedAnswers:any,allAvailableAnswers:any[]){
      let indexes = [];
      previouslySelectedAnswers.forEach((answer,index) =>{
        if(_.indexOf(allAvailableAnswers,answer)){
          indexes.push(index)
        }
      });
      console.log(indexes);
      return indexes;
  }

}