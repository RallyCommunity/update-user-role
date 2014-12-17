Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    //userInfoText: "",
    launch: function() {
        var panel1 = Ext.create('Ext.panel.Panel', {
            layout: 'hbox',
            items: [
                {
                    xtype: 'rallyprojectpicker',
                    fieldLabel: 'select project',
                    id: 'proj',
                    itemId:'proj',
                    margin: 10,
                    listeners:{
                        change: function(combobox){
                            this._onProjectSelected(combobox.getSelectedRecord().get('_ref'));
                        },
                        scope: this
                    }
                },
                {
                    xtype: 'rallyusersearchcombobox',
                    fieldLabel: 'select user:',
                    itemId:'usr',
                    id:'usr',
                    disabled: 'true',
                    margin: 10,
                    listeners:{
                        change: function(combobox){
                            this._onUserSelected(combobox.getRecord());
                        },
                        scope: this
                    }
                },
                {
                    xtype: 'component',
                    itemId: 'user-info',
                    id: 'user-info',
                    html: '',
                    margin: 10
                }
            ]
        });
        this.add(panel1);
    },

    _onProjectSelected:function(projectRef){
        if(this._user){
            Ext.getCmp('usr').setValue(null);
        }
        else{
            Ext.getCmp('usr').enable();
        }
        Ext.getCmp('usr').setProject(projectRef);


    },
    _onUserSelected:function(user){
        this._user = user;
        console.log('user', user);
        console.log('User:', user.get('UserName'), 'Role:', user.get('Role'));

        var userInfoText = 'User: ' + user.get('UserName') + ' Role: ' +  user.get('Role');
        Ext.getCmp('user-info').update(userInfoText);


        this._getUserModel().then({
                success: this._getRoleAllowedValues,
                scope:this
            }).then({
                success:this._makeRolesCobobox,
                scope:this
            });
    },

    _getUserModel:function(){
        return Rally.data.ModelFactory.getModel({
            type:'User'
        });
    },

    _getRoleAllowedValues:function(model){
            this._model = model;
            var deferred = Ext.create('Deft.Deferred');
            var allowedRoleValues = [];
            this._model.getField('Role').getAllowedValueStore().load({
                callback: function(records,operation,success){
                    Ext.Array.each(records,function(allowedValue){
                        allowedRoleValues.push(allowedValue.get('StringValue'));
                    });
                    if(success){
                        deferred.resolve(allowedRoleValues);
                    }
                    else{
                        deferred.reject();
                    }

                }
            }) ;
            return deferred.promise;
    },
    _makeRolesCobobox:function(roles){
        console.log(roles);
        var that = this;
        //var rolesWithoutNull =   _.rest(roles);      //use rolesWithoutNull for store if you don't want to display empty value
        if(!that.down('#panel2')){
            var panel2 = Ext.create('Ext.panel.Panel', {
                id: 'panel2',
                itemId: 'panel2',
                layout: 'hbox',
                title: 'Select Role to update User',
                items: [
                    {
                        xtype: 'rallycombobox',
                        itemId: 'roles-combobox',
                        id: 'roles-combobox',
                        store: roles,
                        margin: 10,
                        listeners:{
                            select: function(combobox){
                                this._onRoleSelected(combobox.getRecord());
                            },
                            scope: this
                        }
                    },
                    {
                        xtype: 'rallybutton',
                        id: 'update-button',
                        itemId: 'update-button',
                        text: 'Update',
                        disabled:true,
                        margin: 10,
                        handler: function() {
                            that._updateRole();
                        }
                    }
                ]

            });
            this.add(panel2);
        }

    } ,
    _onRoleSelected:function(role) {
        //console.log(role.data.field1);
        Ext.getCmp('update-button').enable();
    },

    _updateRole:function(){
        var that = this;
        var selectedRole = Ext.getCmp('roles-combobox').getValue();
        console.log('selected role', selectedRole);
        var id = that._user.get('ObjectID');
        console.log('OID', id);

        this._model.load(id,{
            fetch: ['UserName', 'Role'],
            callback: function(record, operation){
                console.log('Role prior to update:', record.get('Role'));
                record.set('Role', selectedRole);
                record.save({
                    callback: function(record, operation) {
                        if(operation.wasSuccessful()) {
                            var userInfoText = 'User: ' + record.get('UserName') + ' Role updated to: ' +  record.get('Role');
                            Ext.getCmp('user-info').update(userInfoText);
                        }
                        else{
                            console.log("?");
                        }
                    }
                });
            }
        }) ;
    }



});
