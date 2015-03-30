Cities = new Mongo.Collection("cities");
Streets = new Mongo.Collection("streets");
Records = new Mongo.Collection("records");

Streets.attachSchema(new SimpleSchema({
  cityID: {
    type: Meteor.ObjectID,
    autoform: {
      id: "city-select",
      type: "selectize",
      selectize: {
        valueField: '_id',
        labelField: 'name',
        searchField: 'name',
        maxItems: 1,
        create: false,
        options: function(){
          return Cities.find().fetch();
        }
      }
    } 
  },
  name: {
    type: String,
    label: "Street Name"
  }
}));

Cities.attachSchema(new SimpleSchema({
  name: {
    type: String,
    label: "City Name"
  }
}));

Factory.define('city', Cities, {
  name: function () {
    return Fake.word();
  }
});

Factory.define('street', Streets, {
  cityID: Factory.get('city')._id,
  name: function () {
    return Fake.word();
  }
});


Records.attachSchema(new SimpleSchema({
  userID: {
    type: Meteor.ObjectID,
    autoValue: function() {
      return this.userId;
    },
    autoform: {
      omit: true
    }
  },
  name: {
    type: String,
    label: "Name",
    max: 100
  },
  secondname: {
    type: String,
    label: "Second Name",
    max: 100
  },
  surname: {
    type: String,
    label: "Surname",
    max: 100,
    autoform: {
      id: "record-surname"
    }
  },
  city: {
    type: Meteor.ObjectID,
    label: "City",
    autoform: {
      id: "city-select",
      type: "selectize",
      selectize: {
        valueField: '_id',
        labelField: 'name',
        searchField: 'name',
        maxItems: 1,
        create: false,
        options: function(){
          return Cities.find().fetch();
        },
        onChange: function(value) {
          var street = $("#street-select")[0].selectize;
          if (!street) return;
          if (!value || !value.length) {
            street.clearOptions();
            street.disable();
            return;
          }              
          street.clearOptions();
          street.load(function(callback){
            var options = Streets.find({cityID:value}).fetch();
            callback(options);
          });
        }
      }
    }    
  },
  street: {
    type: Meteor.ObjectID,
    label: "Street",
    autoform: {
      id: "street-select",
      type: "selectize",
      selectize: {
        enabled: false,
        valueField: '_id',
        labelField: 'name',
        searchField: 'name',
        maxItems: 1,
        options: function(){
          var streets = Streets.find({ cityID : $("#city-select")[0].selectize.getValue() }).fetch();
          if (!streets.length > 0)
            $("#street-select")[0].selectize.disable();
          else
            $("#street-select")[0].selectize.enable();
          return streets;
        },
        create: false,
        onLoad: function(data) {
          if (data.length > 0)
            $("#street-select")[0].selectize.enable();
        }
      }
    }
  },
  birthdate: {
    type: Date,
    label: "Birthday",
    autoform: {
      type: "bootstrap-datepicker",
      datePickerOptions: {autoclose: true, locale: 'ru'}
    }
  },
  phone: {
    type: String,
    label: "Phone",
    max: 10
  }
}));

Router.configure({
  layoutTemplate: 'main'
});

Router.route('/', function () {
  if (Meteor.userId())
    this.render('newRecord');
  else
    this.render('noAuth');
});

Router.route('/cities', function () {
  this.render('cities', {
    data: { cities: Cities.find().fetch() }
  });
});

Router.route('/streets', function () {
  this.render('streets', {
    data: { streets: Streets.find().fetch() }
  });
});

Router.route('/records', function () {
  this.render('records', {
    data: { records: Records.find({ userID:Meteor.userId() }).fetch() }
  });
});

Router.route('/records/:_id/edit', function () {
  var id = this.params._id;
  var record = Records.findOne({'_id':id});
  this.render('editRecord', {
    data: { record: record }
  });
});

if (Meteor.isClient) {
  Template.hello.helpers({
    activeIfRouteIs: function (template) {
      return template === Iron.Location.get().path ? 'active' : '';
    }
  });

  Template.streets.helpers({
    getCityName: function (cityID) {
      return Cities.findOne({'_id':cityID}).name;
    }
  });

  Template.records.helpers({
    getCityName: function (cityID) {
      return Cities.findOne({'_id':cityID}).name;
    },
    getStreetName: function (streetID) {
      return Streets.findOne({'_id':streetID}).name;
    },
    formatBirthday: function (date) {
      return date.getDate() + "." + date.getMonth() + "." + date.getFullYear();
    }
  });

  AutoForm.addHooks(null, {
    onSubmit: function (doc) {
      console.log(doc);
    },
    onError: function (name, error, template) {
      console.log(name + " error:", error);
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}

if (Meteor.isServer) {
  Records.permit(['insert', 'update', 'remove']).ifLoggedIn().apply();
  Cities.permit(['insert', 'update', 'remove']).apply();
  Streets.permit(['insert', 'update', 'remove']).apply();

  Meteor.startup(function () {
    Cities.remove({});
    Streets.remove({});
    // 4 cities, each with 10 streets
    for (var j = 0; j < 4; j++) {
      var city = Factory.create('city');
      for (var i = 0; i < 10; i++) {
        Factory.create('street', {cityID:city._id});
      };      
    };
  });
}