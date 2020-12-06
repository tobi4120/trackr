// Show all projects
class App extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = {
            boards: [],
            projects: [],
            tasks: [],
            collaborators: [],
            users: [],
            add_requests: [],
            isLoaded: false,
            project_id: "",
            project_name: "",
            description: "",
            due_date: "",
            category:"",
            creation_date: "",
            project_owner: "",
            completed: false,
            new_task: "",
            csrftoken: document.getElementById("csrf_token").value,
            current_user: document.getElementById("current_user").value,
            file_name: document.getElementById("file_name").value,
            reversed: false,
            collaborator_username: "",
            message: "",
            project_message: "",
            message_visibility: false,
            project_message_visibility: false,
            project_message_class: "",
            message_class: "",
            board_name: "",
            board_id: "",
            visible: {
                "project_name": false,
                "description": false,
                "due_date": false,
                "edit_task": false,
                "delete_project": false,
                "new_board_form": false,
                "delete_board": false,
            },
        }
    }

    componentDidMount() {

        // GET boards
        fetch('/apiboards')
        .then(response => response.json())
        .then(boards => {
            this.setState({
                isLoaded: true,
                boards: boards,
            })
        });
        
        // GET projects
        fetch('/apiprojects')
        .then(response => response.json())
        .then(projects => {
            this.setState({
                projects: projects,
            })
        });

        // GET users
        fetch('/apiusers')
            .then(response => response.json())
            .then(users => {
                this.setState({
                    users: users,
                })
            });
        
        // GET add_requests
        fetch('apiadd_requests/')
            .then(response => response.json())
            .then(add_requests => {
                this.setState({
                    add_requests: add_requests,
                })
            });
    }

    // Open modal
    open_modal = (element) => {
        document.querySelector(element).style.display = "block"
      }

    // Clear contents
    clear_contents = () => {
        this.setState({
            project_name: "",
            description: "",
            due_date: "",
        })
    }
    
    // Close modal
    close_modal = (element) => {
        document.querySelector(element).style.display = "none"

        // Reverse
        let new_task_list = this.state.tasks.reverse()

        this.setState({
            tasks: new_task_list,
        })
    }

    // Inputs changing
    handleChange = (event) => {

        this.setState({
            [event.target.name]: event.target.value
        });
    }

    // POST Request to create new project and add it to the selected board
    handleSubmit = (event) => {
        
        event.preventDefault();

        // Create the project
        fetch('/apiprojects/', {
            method: 'POST',
            body: JSON.stringify({
                project_name: this.state.project_name,
                description: this.state.description,
                due_date: this.state.due_date,
                category: this.state.category,
                completed: false,
                collaborators: [],
            }),
            headers: { "X-CSRFToken": this.state.csrftoken, "Content-Type": "application/JSON" }
        })
        .then(response => response.json())
        .then(result => {
            
            // Copy boards array
            let boards_array = this.state.boards

            // Find current board index
            var Index = boards_array.findIndex(x => x.id === this.state.board_id);

            // Append project to this.state.projects
            let all_projects = this.state.projects

            all_projects.push(result)

            this.setState({projects: all_projects})

            // Append project to projects array on board
            boards_array[Index]["projects"].push(result)
            
            this.setState({
                boards: boards_array
            })

            // Get board projects
            fetch(`/apiboards/${this.state.board_id}/`)
            .then(response => response.json())
            .then(board => {

                let project_ids = [];
                var i;

                for (i=0; i < board['projects'].length; i++) {
                    project_ids.push(board['projects'][i]['id'])
                }

                project_ids.push(result['id'])

                // Add it to the board
                fetch(`/apiboards/${this.state.board_id}/`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        projects: project_ids,
                    }),
                    headers: { "X-CSRFToken": this.state.csrftoken, "Content-Type": "application/JSON" }
                }) 
            });   

            // Close the modal
            this.close_modal('.bg-modal');

            // Add project to projects array and flash message to user
            this.setState({
                message: `${this.state.project_name} has been created!`,
                message_class: 'alert alert-success',
                message_visibility: true
            })
            
        });
    }
    
    // Load project onto modal
    load_project = (project, board_id) => {
        
        var new_tasks = project.tasks.reverse()

        // Update the project info
        this.setState({
            project_id: project.id,
            project_name: project.project_name,
            due_date: project.due_date,
            description: project.description,
            category: project.category,
            creation_date: project.creation_date,
            project_owner: project.project_owner,
            completed: project.completed,
            tasks: new_tasks,
            collaborators: project.collaborators,
            board_id: board_id,
        })

    }

    // On textarea 
    on_textarea = () => {
        document.querySelector(".add_task").style.display = "block"
        document.querySelector(".new_task").style.height= "36px"
    }

    // Off textarea
    off_textarea = () => {
        document.querySelector(".add_task").style.display = "none"
        document.querySelector(".new_task").style.height = "18px"

        this.setState({
            new_task: "",
        })
    }

    // Create new task
    new_task_submit = () => {
        
        fetch('/apitasks/', {
            method: 'POST',
            body: JSON.stringify({
                task_description: this.state.new_task,
                completed: false,
                project: this.state.project_id
            }),
            headers: { "X-CSRFToken": this.state.csrftoken, "Content-Type": "application/JSON" }
        })
        .then(response => response.json())
        .then(result => {
            
            // Copy boards array
            let boards = [...this.state.boards]

            // Find current board index
            var board_Index = boards.findIndex(x => x.id == this.state.board_id);

            // Find project index inside board
            var project_Index = boards[board_Index]["projects"].findIndex(x => x.id == this.state.project_id)

            // Append task to array
            boards[board_Index]["projects"][project_Index]["tasks"].splice(0, 0, result)

            // Update state
            this.setState({
                boards: boards,
            })
        });
    }

    // Request to add person to project
    request_to_add = (event) => {
        event.preventDefault();

        // If request is for a non-existent user, don't allow
        if (this.state.users.some(e => e.username === this.state.collaborator_username) === false) {

            // Flash message and clear input
            this.setState({
                project_message: `Error: ${this.state.collaborator_username} does not exist!`,
                project_message_visibility: true,
                project_message_class: "alert alert-danger",
                collaborator_username: ""
            })

            return
        }

        // If request already sent to this person, don't allow user to send another one
        if (this.state.add_requests.some(e => e.to === this.state.collaborator_username && e.project === this.state.project_id) === true) {

            // Flash message and clear input
            this.setState({
                project_message: `A request has already been sent to ${this.state.collaborator_username}. Please wait for a response.`,
                project_message_visibility: true,
                project_message_class: "alert alert-warning",
                collaborator_username: ""
            })

            return
        }

        // If request is for a person already on the project, don't allow
        // Find project index
        let project_index = this.state.projects.findIndex(x => x.id === this.state.project_id)

        if (this.state.projects[project_index]['collaborators'].some(e => e.collaborator_name === this.state.collaborator_username) === true || 
        this.state.projects[project_index]['project_owner'] === this.state.collaborator_username) {
            
            // Flash message and clear input
            this.setState({
                project_message: `Error: ${this.state.collaborator_username} is already on the project.`,
                project_message_visibility: true,
                project_message_class: "alert alert-danger",
                collaborator_username: ""
            })

            return
        }

        fetch('/apiadd_requests/', {
            method: 'POST',
            body: JSON.stringify({
                sent_by: this.state.current_user,
                to: this.state.collaborator_username,
                project: this.state.project_id,
                project_name: this.state.project_name
            }),
            headers: { "X-CSRFToken": this.state.csrftoken, "Content-Type": "application/JSON" }
        })
        .then(response => response.json())
        .then(result => {
            
            // Add user to collaborators array and flash message
            this.setState({
                add_requests: [...this.state.add_requests, result],
                collaborator_username: "",
                project_message: `A request has been sent to add ${this.state.collaborator_username}!`,
                project_message_visibility: true,
                project_message_class: "alert alert-success"
            })           
        });
        
    }

    edit = (field) => {
        
        // If someone other than the project owner is trying to edit, don't allow
        if (this.state.project_owner != this.state.current_user || this.state.completed === true) {
            return
        }

        // Date special case
        if (field === 'due_date') {

            if (this.state.visible['due_date'] === false) {

                let visible = {...this.state.visible};

                visible["due_date"] = true;

                this.setState({
                    visible: visible,
                })

                return
            }
        }

        // PATCH request
        fetch(`/apiprojects/${this.state.project_id}/`, {
            method: 'PATCH',
            body: JSON.stringify({
                [field]: this.state[field],
            }),
            headers: { "X-CSRFToken": this.state.csrftoken, "Content-Type": "application/JSON" }
        })
        .then(response => response.json())
        .then((result) => {

            // Copy boards array
            let boards = [...this.state.boards]

            // Find current board index
            var board_Index = boards.findIndex(x => x.id == this.state.board_id);

            // Find project index inside board
            var project_Index = boards[board_Index]["projects"].findIndex(x => x.id == this.state.project_id)

            // Update field
            boards[board_Index]["projects"][project_Index][field] = result[field];

            // Update state
            this.setState({boards: boards})

            // Need to also update this.state.due_date if field is date
            if (field === "due_date") {
                this.setState({
                    due_date: result[field]
                })
            }

            // Hide textbox
            let visible = {...this.state.visible};

            visible[field] = false;

            this.setState({visible: visible})
        });
        
    }

    // Remove person from project
    remove = (collaborator_id, collaborator_name) => {
        
        // Delete collaborator
        fetch(`/apicollaborators/${collaborator_id}`, {
            method: 'DELETE',
            headers: { "X-CSRFToken": this.state.csrftoken, "Content-Type": "application/JSON" }
        })
        .then(() => {

            // Copy boards array
            let boards = [...this.state.boards]

            // Find current board index
            var board_Index = boards.findIndex(x => x.id == this.state.board_id);

            // Find project index inside board
            var project_Index = boards[board_Index]["projects"].findIndex(x => x.id == this.state.project_id)

            // Find collab index inside project
            var collab_Index = boards[board_Index]["projects"][project_Index]["collaborators"].findIndex(x => x.id == collaborator_id)

            // Remove it from array
            boards[board_Index]["projects"][project_Index]["collaborators"].splice(collab_Index, 1)

            // Copy collaborators array
            let collaborators = [...this.state.collaborators];
            
            // Find current collaborator index
            var Index = collaborators.findIndex(x => x.id == collaborator_id);

            // Remove collaborator from array
            collaborators.splice(Index, 1)

            // Update state
            this.setState({
                collaborators: collaborators,
                boards: boards,
            })
        });

        // Delete from board
        // Find board
        this.state.boards.forEach(board => {
            let project_index = board['projects'].findIndex(x => x.id === this.state.project_id)

            if (project_index !== -1) {
                if (board['board_creator'] === collaborator_name) {

                    // Get board projects
                    fetch(`/apiboards/${board['id']}/`)
                    .then(response => response.json())
                    .then(board => {

                        let project_ids = [];
                        let i;

                        for (i=0; i < board['projects'].length; i++) {

                            if (board['projects'][i].id !== board['projects'][project_index]['id']) {
                                project_ids.push(board['projects'][i]['id'])
                            }
                        }

                        // Update board projects
                        fetch(`/apiboards/${board['id']}/`, {
                            method: 'PATCH',
                            body: JSON.stringify({
                                projects: project_ids,
                            }),
                            headers: { "X-CSRFToken": this.state.csrftoken, "Content-Type": "application/JSON" }
                        }) 
                    });
                }
            }
        });

    }

    // Edit task
    edit_task = (task_id, description) => {
        
        // PATCH Request
        fetch(`/apitasks/${task_id}/`, {
            method: 'PATCH',
            body: JSON.stringify({
                task_description: description,
            }),
            headers: { "X-CSRFToken": this.state.csrftoken, "Content-Type": "application/JSON" }
        })
    }

    // Delete project
    delete_project = () => {

        // Open pop up modal that asks if users are sure they want to delete the project
        let visible = {...this.state.visible};

        visible["delete_project"] = true;

        this.setState({visible: visible})
    }

    delete_project_yes = (project_id) => {
        
        // DELETE request
        fetch(`/apiprojects/${project_id}`, {
            method: 'DELETE',
            headers: { "X-CSRFToken": this.state.csrftoken, "Content-Type": "application/JSON" }
        })
        .then(() => {
            window.location.reload();
        })
    }

    delete_project_no = () => {
        
        // Close pop up
        let visible = {...this.state.visible};

        visible["delete_project"] = false;

        this.setState({visible: visible})
    }

    complete_project = (project_id) => {

        if (this.state.completed === false) {
            
            // PATCH request
            fetch(`/apiprojects/${project_id}/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    completed: true,
                }),
                headers: { "X-CSRFToken": this.state.csrftoken, "Content-Type": "application/JSON" }
            })
            .then(() => {

                // Copy boards array
                let boards = [...this.state.boards]

                // Find current board index
                var board_Index = boards.findIndex(x => x.id == this.state.board_id);

                // Find project index inside board
                var project_Index = boards[board_Index]["projects"].findIndex(x => x.id == this.state.project_id)

                // Update field
                boards[board_Index]["projects"][project_Index]["completed"] = true

                // Update state
                this.setState({
                    boards: boards,
                    completed: true,
                })
            })

        } else {

            // PATCH request
            fetch(`/apiprojects/${project_id}/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    completed: false,
                }),
                headers: { "X-CSRFToken": this.state.csrftoken, "Content-Type": "application/JSON" }
            })
            .then(() => {

                // Copy boards array
                let boards = [...this.state.boards]

                // Find current board index
                var board_Index = boards.findIndex(x => x.id == this.state.board_id);

                // Find project index inside board
                var project_Index = boards[board_Index]["projects"].findIndex(x => x.id == this.state.project_id)

                // Update field
                boards[board_Index]["projects"][project_Index]["completed"] = false

                // Update state
                this.setState({
                    boards: boards,
                    completed: false,
                })
            })
        }
    }

    // Leave Project
    leave_project = () => {
        
        var Index = this.state.collaborators.findIndex(x => x.project === this.state.project_id && 
            x.collaborator_name === this.state.current_user);

        var collaborator_id = this.state.collaborators[Index].id
        
        this.remove(collaborator_id)

        this.close_modal('.bg-modal2')

        // Delete from board
        // Get board projects
        fetch(`/apiboards/${this.state.board_id}/`)
        .then(response => response.json())
        .then(board => {

            let project_ids = [];
            let i;

            for (i=0; i < board['projects'].length; i++) {

                if (board['projects'][i].id !== this.state.project_id) {
                    project_ids.push(board['projects'][i]['id'])
                }
            }

            // Update board projects
            fetch(`/apiboards/${this.state.board_id}/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    projects: project_ids,
                }),
                headers: { "X-CSRFToken": this.state.csrftoken, "Content-Type": "application/JSON" }
            }) 
            .then(() => {

                // Find board index
                let board_index = this.state.boards.findIndex(x => x.id === this.state.board_id)

                // Find project index
                let project_index = this.state.boards[board_index]['projects'].findIndex(x => x.id === this.state.project_id)

                // Copy boards
                let boards = this.state.boards

                // Remove project from board
                boards[board_index]['projects'].splice(project_index, 1)

                // Update state
                this.setState({boards: boards})

            })
        }); 

        // Flash message
        this.setState({
            message: `You have successfully left '${this.state.project_name}'`,
            message_class: "alert alert-success",
            message_visibility: true
        })
        
    }

    // Delete Task 
    delete_task = (task_id) => {
        
        // Delete tasks
        fetch(`/apitasks/${task_id}`, {
            method: 'DELETE',
            headers: { "X-CSRFToken": this.state.csrftoken, "Content-Type": "application/JSON" }
        })
        .then(() => {

            // Copy boards array
            let boards = [...this.state.boards]

            // Find current board index
            var board_Index = boards.findIndex(x => x.id == this.state.board_id);

            // Find project index inside board
            var project_Index = boards[board_Index]["projects"].findIndex(x => x.id == this.state.project_id)

            // Find task index inside project
            var task_Index = boards[board_Index]["projects"][project_Index]["tasks"].findIndex(x => x.id == task_id)

            // Remove it from array
            boards[board_Index]["projects"][project_Index]["tasks"].splice(task_Index, 1)

            // Update state
            this.setState({
                boards: boards,
            })
        });
    }

    // Complete task
    complete_task = (task_id, state) => {
        
        // PATCH request
        fetch(`/apitasks/${task_id}/`, {
            method: 'PATCH',
            body: JSON.stringify({
                completed: state,
            }),
            headers: { "X-CSRFToken": this.state.csrftoken, "Content-Type": "application/JSON" }
        })
        
        .then(() => {

            // Copy boards array
            let boards = [...this.state.boards]

            // Find current board index
            var board_Index = boards.findIndex(x => x.id == this.state.board_id);

            // Find project index inside board
            var project_Index = boards[board_Index]["projects"].findIndex(x => x.id == this.state.project_id)

            // Find task index inside project
            var task_Index = boards[board_Index]["projects"][project_Index]["tasks"].findIndex(x => x.id == task_id)

            // Update field
            boards[board_Index]["projects"][project_Index]["tasks"][task_Index]['completed'] = state

            // Update state
            this.setState({
                boards: boards,
            })
        })
    }

    // Close Message
    close_message = () => {
        this.setState({
            message: "",
            message_visibility: false,
        })
    }

    // Close Project Message
    close_project_message = () => {

        this.setState({
            project_message: "",
            project_message_visibility: false,
        })
    }

    // Handle change for tasks
    handleChange2 = (event) => {

        let tasks = this.state.tasks;

        // Don't allow change if not the task owner or project is complete
        if (this.state.current_user !== tasks[event.target.name]["task_owner"] ||
        this.state.completed === true) {
            return
        }
        
        tasks[event.target.name]["task_description"] = event.target.value

        this.setState({ tasks: tasks })
    }

    // Load board name and ID
    load_board_name = (board_name, board_id) => {
        this.setState({
            board_name: board_name,
            board_id: board_id
        })
    }

    // New board
    new_board = (event) => {
        event.preventDefault()

        // Check if board name already exists
        let index = this.state.boards.findIndex(x => x.board_name === this.state.board_name 
        && x.board_creator == this.state.current_user);

        // If it does then flash error message and don't allow submit
        if (index >= 0) {

            // Hide modal
            let visible = this.state.visible
            visible['new_board_form'] = false
            
            // Error message and hide modal
            this.setState({
                message: 'Error: Board name already exists',
                message_class: "alert alert-danger",
                message_visibility: true,
                visible: visible,
                board_name: "",
            })

            return
        }

        fetch('/apiboards/', {
            method: 'POST',
            body: JSON.stringify({
                board_name: this.state.board_name,
                color: "purple"
            }),
            headers: { "X-CSRFToken": this.state.csrftoken, "Content-Type": "application/JSON" }
        })
        .then(response => response.json())
        .then((result) => { 

            // Hide modal
            let visible = this.state.visible
            visible['new_board_form'] = false

            // Set states and flash message
            this.setState({
                boards: [...this.state.boards, result],
                visible: visible,
                board_name: "",
                message: `${this.state.board_name} has been created!`,
                message_class: "alert alert-success",
                message_visibility: true
            })
        })
        
    }

    // Delete board pop up
    delete_board_popup = (board_id, board_name) => {
        
        // Show pop up
        let visible = this.state.visible
        visible['delete_board'] = true

        this.setState({
            visible: visible,
            board_id: board_id,
            board_name: board_name,
        })

    }
    
    // Delete board
    delete_board = (board_id, board_name) => {

        // Check if the board has projects in it, if it does do not allow the user to delete the board
        let boards = [...this.state.boards]
        let index = boards.findIndex(x => x.id === board_id)

        if (boards[index]['projects'].length > 0) {

            // Hide delete pop up
            let visible = this.state.visible
            visible['delete_board'] = false

            //Error message
            this.setState({
                visible: visible,
                message_visibility: true,
                message_class: "alert alert-danger",
                message: `Error: This board cannot be deleted because it contains projects. Please delete or leave all projects first.`,
            })

            return
        }
        
        // DELETE Request
        fetch(`/apiboards/${board_id}`, {
            method: 'DELETE',
            headers: { "X-CSRFToken": this.state.csrftoken, "Content-Type": "application/JSON" }
        })
        .then(() => {

            // Remove board from this.state.boards
            boards.splice(index, 1)

            // Hide pop up
            let visible = this.state.visible
            visible['delete_board'] = false

            // Set states
            this.setState({
                boards: boards,
                message_visibility: true,
                message_class: "alert alert-success",
                message: `'${board_name}' has been successfully deleted!`,
                visible: visible,
                board_id: "",
                board_name: "",
            })
        })
    }

    // Clear messages
    clear_messages = () => {
        this.setState({
            project_message: "",
            project_message_visibility: false,
        })
    }

    // Clear board name when someone clicks on "New Board" button
    clear_name = () => {
        this.setState({
            board_name: "",
        })
    }

    render() { 

        var { isLoaded } = this.state;

        if (!isLoaded) {
            return (<div>Loading...</div>);
        }
        else {
            return(
                <div>
                    <Navbar 
                        add_requests={this.state.add_requests} 
                        current_user={this.state.current_user} 
                        csrftoken={this.state.csrftoken}
                        close_modal={this.state.close_modal}
                        file_name={this.state.file_name}
                        boards={this.state.boards}
                        board_name={this.state.board_name} />

                    <Messages
                        message={this.state.message}
                        message_class={this.state.message_class}
                        message_visibility={this.state.message_visibility}
                        close_message={this.close_message} />

                    <h2 className="title">My Projects</h2>

                    <New_board 
                        visible={this.state.visible}
                        new_board={this.new_board}
                        board_name={this.state.board_name}
                        handleChange={this.handleChange}
                        clear_name={this.clear_name} />
                    
                    {this.state.visible.delete_board === true?
                        <div className="delete_board_popup">
                            <p className="are_you_sure_board">Are you sure you want to delete this board?</p>

                            <div className="delete_buttons">
                                <button className="yes_delete button-primary" onClick={() => this.delete_board(this.state.board_id, this.state.board_name)}>
                                    Yes
                                </button>

                                <button className="no_delete button-primary" onClick={() => {
                                    let visible = this.state.visible
                                    visible['delete_board'] = false
                            
                                    this.setState({
                                        visible: visible,
                                        board_id: "",
                                        board_name: ""})

                                }}>No</button>
                            </div>
                            
                        </div>: null}

                    <All_boards 
                        boards={this.state.boards}
                        current_user={this.state.current_user} 
                        delete_board_popup={this.delete_board_popup}
                        open_modal={this.open_modal}
                        load_project={this.load_project}
                        clear_contents={this.clear_contents}
                        load_board_name={this.load_board_name}
                        close_modal={this.close_modal}
                        handleSubmit={this.handleSubmit}
                        project_name={this.state.project_name}
                        description={this.state.description}
                        due_date={this.state.due_date}
                        handleChange={this.handleChange}
                        board_name={this.state.board_name}
                        csrftoken={this.state.csrftoken} />

                    <div className="bg-modal2">
                        <div id="project_content">
                            <div>
                                <button className='close_button' onClick={() => {this.close_modal('.bg-modal2'); this.clear_messages()}}>&times;</button>
                            </div>
                            
                            <div id="project_info">
                                <Completed_banner
                                    completed={this.state.completed} />

                                <Project_messages
                                    project_message_visibility={this.state.project_message_visibility}
                                    project_message={this.state.project_message}
                                    close_project_message={this.close_project_message}
                                    project_message_class={this.state.project_message_class} />

                                <Project_name 
                                    project_name={this.state.project_name} 
                                    visible={this.state.visible} 
                                    edit={this.edit} 
                                    handleChange={this.handleChange}
                                    project_owner={this.state.project_owner}
                                    current_user={this.state.current_user} 
                                    completed={this.state.completed} />

                                <Created_by 
                                    project_owner={this.state.project_owner} 
                                    creation_date={this.state.creation_date} /><br />

                                <Due_date 
                                    due_date={this.state.due_date} 
                                    visible={this.state.visible} 
                                    edit={this.edit} 
                                    handleChange={this.handleChange} />
                                
                                <Description 
                                    description={this.state.description} 
                                    visible={this.state.visible} 
                                    edit={this.edit} 
                                    handleChange={this.handleChange}
                                    project_owner={this.state.project_owner}
                                    current_user={this.state.current_user} 
                                    completed={this.state.completed} />

                                <Collaborators 
                                    collaborators={this.state.collaborators} 
                                    request_to_add={this.request_to_add} 
                                    collaborator_username={this.state.collaborator_username} 
                                    handleChange={this.handleChange} 
                                    users={this.state.users}
                                    project_owner={this.state.project_owner}
                                    current_user={this.state.current_user} 
                                    project_id={this.state.project_id}
                                    remove={this.remove}
                                    completed={this.state.completed}
                                    leave_project={this.leave_project} />

                                <div id="completed_and_delete">
                                    <Completed 
                                        project_id={this.state.project_id}
                                        complete_project={this.complete_project}
                                        completed={this.state.completed}
                                        project_owner={this.state.project_owner}
                                        current_user={this.state.current_user} />           

                                    <Delete 
                                        project_id={this.state.project_id}
                                        delete_project={this.delete_project}
                                        delete_project_yes={this.delete_project_yes} 
                                        delete_project_no={this.delete_project_no}
                                        project_owner={this.state.project_owner} 
                                        current_user={this.state.current_user}
                                        project_name={this.state.project_name}
                                        visible={this.state.visible} />
                                </div>

                                <Tasks 
                                    new_task={this.state.new_task} 
                                    handleChange={this.handleChange}
                                    on_textarea={this.on_textarea}
                                    off_textarea={this.off_textarea}
                                    new_task_submit={this.new_task_submit}
                                    tasks={this.state.tasks} 
                                    current_user={this.state.current_user}
                                    edit_task={this.edit_task} 
                                    visible={this.state.visible}
                                    completed={this.state.completed}
                                    delete_task={this.delete_task}
                                    complete_task={this.complete_task}
                                    handleChange2={this.handleChange2} />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    }
}

ReactDOM.render(<App />, document.querySelector("#all_projects"));

// New Board
class New_board extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            visible: this.props.visible
        }
    }

    render() {
        return (
            <div>
                <button className="button-primary center-btn" onClick={()=>{
                        let visible = this.state.visible
                        visible['new_board_form'] = true

                        this.setState({visible: visible})
                        this.props.clear_name()
                    }}>New Board</button>

                    {this.state.visible.new_board_form === true?
                    <div className="bg-modal3">
                        <div className='new_board_modal'>

                            <a className="close" onClick={()=>{
                                let visible = this.state.visible
                                visible['new_board_form'] = false

                                this.setState({visible: visible})}}>&times;</a>

                            <h2 className="title modal-header">New Board</h2>
                            <form className="new_project_form" onSubmit={this.props.new_board}>
                                <input className="new_project_input" placeholder="Board Name" autoComplete="off" type="text" name='board_name' 
                                    value={this.props.board_name} onChange={this.props.handleChange} required /><br />
                                <input className="button-primary center-btn" type="submit" value="Create Board" />
                            </form>
                        </div>
                    </div>: null}
            </div>
        )
    }
}

// New Project
class New_project extends React.Component {

    render() {
        return (
            <div className="bg-modal">
                <div id='new_project_modal'>
                    <a className="close" onClick={() => this.props.close_modal('.bg-modal')}>&times;</a>
                    <h2 className="title modal-header">New Project</h2>
                    <form className="new_project_form" autoComplete="off" onSubmit={this.props.handleSubmit}>
                        <input className="new_project_input" type='text' name='project_name' placeholder="Project Name" value={this.props.project_name} onChange={this.props.handleChange} required/><br/>
                        <textarea className="new_project_textarea" name='description' placeholder="Describe your project..." value={this.props.description} onChange={this.props.handleChange} /><br/>
                        <div className="due"><p className="due_label">Due:</p> <input className="new_project_input" type="datetime-local" name='due_date' placeholder="Due" value={this.props.due_date} onChange={this.props.handleChange} required/></div>
                        <input className="button-primary create-btn" type="submit" value="Create Project" />
                    </form>
                </div>
            </div>
        )
    }

}

// All_boards
class All_boards extends React.Component {

    render() {
        return (
            <div className="all_boards">

                {this.props.boards.map(board => {
                    if (board.board_creator === this.props.current_user) {
                        return <div key={board.id} className="board">

                            <Color 
                                color={board.color}
                                open_modal={this.props.open_modal}
                                clear_contents={this.props.clear_contents}
                                load_board_name={this.props.load_board_name}
                                board_name={board.board_name}
                                board_id={board.id}
                                board_projects = {board.projects}
                                current_user={this.props.current_user}
                                load_project={this.props.load_project}
                                csrftoken={this.props.csrftoken}
                                delete_board_popup={this.props.delete_board_popup} />

                            <New_project 
                                close_modal={this.props.close_modal}
                                handleSubmit={this.props.handleSubmit}
                                project_name={this.props.project_name}
                                description={this.props.description}
                                due_date={this.props.due_date}
                                handleChange={this.props.handleChange}
                                board_name={this.props.board_name} />
                        </div>
                    }
                })}
            </div>
        )
    }
}

// Change color
class Color extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = {
            color: this.props.color,
            button_class: '',
            active_class: '',
            color_menu_visible: false,
        }
    }

    componentDidMount() {
        this.setState({
            button_class: `button-primary new-project ${this.state.color}`,
            active_class: `active ${this.state.color}_2`
        })
    }

    // Changing color
    handleChange = (event) => {

        // PUT Request
        fetch(`/apiboards/${this.props.board_id}/`, {
            method: 'PATCH',
            body: JSON.stringify({
                color: event.target.value
            }),
            headers: { "X-CSRFToken": this.props.csrftoken, "Content-Type": "application/JSON" }
        })

        // Set state
        this.setState({
            color: event.target.value,
            button_class: `button-primary new-project ${event.target.value}`,
            active_class: `active ${event.target.value}_2`,
            color_menu_visible: false,
        });

    }

    render() {
        return (
            <div>
                <div className="name_and_dropdown">
                    <h3 className="board_name">{this.props.board_name}</h3>
                    <div className="task_dropdown">
                            <i className="fas fa-ellipsis-h board_options fa-sm"></i>
                            
                            <div className="task_dropdown_content">
                                <a onClick={() => this.setState({color_menu_visible: true})}><i className="fas fa-paint-brush"></i>Change Color</a>
                                <a onClick={() => this.props.delete_board_popup(this.props.board_id, this.props.board_name)}>
                                    <i className="fas fa-trash-alt"></i>Delete</a> 
                            </div>
                    </div> 
                </div>
                <hr />

                {this.state.color_menu_visible === true?
                    <select name="color" value={this.state.color} onChange={this.handleChange} className="color_dropdown">
                        <option value="blue">Sky Blue</option>
                        <option value="pink">Hot Pink</option>
                        <option value="purple">Deep Purple</option>
                        <option value="red">Burgundy Red</option>
                        <option value="green">Forest Green</option>
                        <option value="orange">Fire Orange</option>
                        <option value="yellow">Golden Yellow</option>
                        <option value="brown">Wooden Brown</option>
                        <option value="dark_blue">Jet Blue</option>
                    </select>:null}

                <All_projects
                    board_projects = {this.props.board_projects}
                    current_user={this.props.current_user}
                    open_modal={this.props.open_modal}
                    load_project={this.props.load_project}
                    board_id={this.props.board_id}
                    color={this.props.color}
                    active_class={this.state.active_class} />
                
                <button className={this.state.button_class}
                        onClick={() => {this.props.open_modal('.bg-modal'); this.props.clear_contents(); this.props.load_board_name(this.props.board_name, this.props.board_id)
                        }}>New Project
                </button>
            </div>
            
        )
    }
}

// All_projects
class All_projects extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            completed: false,
            style_in_progress: this.props.active_class,
            style_complete: "inactive"
        }
    }

    componentDidUpdate() {
        if (this.state.style_in_progress !== this.props.active_class && 
            this.state.style_complete !== this.props.active_class) {
            
            this.menu(this.state.completed)
        }
    }

    // In Progress or Completed
    menu = (status) => {
            
        this.setState({completed: status})

        if (status === false) {
            this.setState({
                style_in_progress: this.props.active_class,
                style_complete: "inactive"
            })
        } else {
            this.setState({
                style_in_progress: "inactive",
                style_complete: this.props.active_class
            })
        }
    }

    render() {
        return (
            <div>
                <div className="menu">
                    <div className="types">
                        <h3 className={this.state.style_in_progress} onClick={()=> this.menu(false)}>In Progress</h3>
                        <h3 className={this.state.style_complete} onClick={()=> this.menu(true)}>Completed</h3>
                    </div>
                </div>
                
                {this.props.board_projects.map(project => {

                    // Completed vs. in progress
                    if (project.completed === this.state.completed) {

                        return <div key={project.id} className='project' onClick={() => {
                                    this.props.open_modal('.bg-modal2');
                                    this.props.load_project(project, this.props.board_id)}}>

                                        <div className="title_created_by">
                                            <div className="project_project-name">{project.project_name}</div>
                                            <div className="created-by">Created by, {project.project_owner}</div>
                                        </div>
                                        
                                        <div className="due_date_home">
                                            Due: {new Intl.DateTimeFormat("en-US", {
                                                month: "short",
                                                day: "2-digit",
                                                weekday: "short",
                                                hour: "numeric",
                                                minute: "numeric",
                                                timeZone: "EST"
                                                
                                            }).format(new Date(project.due_date))}<br />
                                        </div>
                                </div>      
                    }
                })}
            </div>
        )
    }
}

// Project Name
class Project_name extends React.Component {

    render() {
        return (
            <div className="project_header">
                <input className="edit_project_name" type="text" autoComplete="off" autoFocus
                    name="project_name" value={this.props.project_name} onChange=
                    {this.props.project_owner != this.props.current_user || this.props.completed === true? null: this.props.handleChange}
                    onBlur={() => this.props.edit('project_name')} />
            </div>
        )
    }
}

// Project description
class Description extends React.Component {

    render() {
        return(
            <div className="project_description">
                    <div className="edit_description_container">
                        <p className="description_lablel">Description:</p> <textarea autoComplete="off" className="edit_description"
                            name="description" value={this.props.description} onChange = 
                            {this.props.project_owner != this.props.current_user || this.props.completed === true? null: this.props.handleChange}
                            onBlur={() => this.props.edit('description')}/>
                    </div>
            </div>
        )
    }
}

// Project due date
class Due_date extends React.Component {
    
    render() {
        return(
            <div>

                {this.props.visible.due_date === false?
                    <div className="project_due_date">
                        Due date: <p onClick={() => this.props.edit('due_date')} className="dark-grey date">{this.props.due_date != ""? new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "2-digit",
                            weekday: "long",
                            hour: "numeric",
                            minute: "numeric",
                            timeZone: "EST"
                            
                        }).format(new Date(this.props.due_date)): null}</p>
                    </div>: 

                    <div className="project_due_date"> 
                        Due date: <input autoFocus className="date-picker" autoComplete="off" type="datetime-local" name="due_date" value={this.props.due_date} 
                            onChange={this.props.handleChange} onBlur={() => this.props.edit('due_date')}/>
                    </div>}

            </div>
        )   
    }
}

// Created By
class Created_by extends React.Component {

    render() {
      return(
        <div className="created_by">
            Created by {this.props.project_owner} on {this.props.creation_date != ""? new Intl.DateTimeFormat("en-US", {
                    year: "numeric",
                    weekday: "short",
                    month: "short",
                    day: "2-digit",
                    timeZone: "America/New_York"
                }).format(new Date(this.props.creation_date)): null}
        </div>
      )  
    }
}

// Collaborators
class Collaborators extends React.Component {
 
    render() {
        return(
            <div>
                <div id="collaborator_list"> 
                    <p className="people_on_project">People on project:</p> {this.props.collaborators.map((collaborator) => {

                        return (
                            <div key={collaborator.id} className="collaborator">
                                <div className="collaborator_name">
                                    {collaborator.collaborator_name}
                                    
                                    {this.props.current_user === this.props.project_owner?
                                        <a className="remove_person" onClick={() => this.props.remove(collaborator.id, collaborator.collaborator_name)}>
                                            <p className="x">&times;</p>
                                        </a>: null}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {this.props.completed === false?
                    <div id='add_person'>
                        <form autoComplete="off" onSubmit={this.props.request_to_add}>
                            <input type="text" list="users" name='collaborator_username' value={this.props.collaborator_username} 
                                onChange={this.props.handleChange} />

                                <datalist id="users">
                                    {this.props.users.map(user => {
                                        if (this.props.project_owner !== user.username) {

                                            if (this.props.collaborators == "") {
                                                return(<option key={user.id} value={user.username}>{user.username}</option>)
                                            }

                                            if (this.props.collaborators.some(e => e.collaborator_name == user.username) === false) {
                                                return(<option key={user.id} value={user.username}>{user.username}</option>)
                                            }
                                        }
                                    })}
                                </datalist>
                            <input type="submit" className="button-primary" value="Invite to join project" 
                            disabled={this.props.collaborator_username === ""? true: false}></input>

                        </form>
                    </div>: null}

                    {this.props.project_owner !== this.props.current_user?
                        <button className="leave_project" onClick={this.props.leave_project}>Leave project</button>: null}

            </div>
        )
    }
}

// Complete project
class Completed extends React.Component {

    render() {
        return (
            <div id="completed">
                {this.props.project_owner === this.props.current_user?
                    this.props.completed === false?
                        <button onClick={()=> this.props.complete_project(this.props.project_id)}>Mark project as complete</button>:
                        <button onClick={()=> this.props.complete_project(this.props.project_id)}>Mark project as in progress</button>: null}
            </div>
        )
    }
}

// Delete project
class Delete extends React.Component {

    render() {
        return (
            <div>
                {this.props.project_owner === this.props.current_user?
                    <button className="delete" onClick={()=> this.props.delete_project()}>Delete Project</button>: null}

                {this.props.visible.delete_project === true?
                    <div id='popup_delete'>
                        Are you sure you want to delete "{this.props.project_name}"? <br />
                        <button className="button-primary yes" onClick={()=> this.props.delete_project_yes(this.props.project_id)}>Yes</button>
                        <button className="button-primary no" onClick={this.props.delete_project_no}>No</button>
                    </div>: null}
           </div>
        )
    }
}

// Tasks
class Tasks extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            complete_class: "complete_class task"
        }
    }

    render(){
        return (
            <div>
                <h3 className="tasks_header">Tasks and Updates</h3>        
                <div>
                {this.props.completed === false?
                        <textarea id="new_task_textbox" name='new_task' placeholder='Add a task/update...' value={this.props.new_task} 
                            onChange={this.props.handleChange} className='task new_task' onFocus={() => this.props.on_textarea()}
                            onBlur={() => this.props.off_textarea()}>
                        </textarea>: null}

                    {this.props.completed === false?
                        <button className="add_task button-primary" disabled={this.props.new_task === ""? true: false} onMouseDown={() => this.props.new_task_submit()}>Add Task</button>: null}
                    
                    {this.props.tasks.map( (task, i) => {
                        return (
                            <div key={task.id} className={task.completed === true? this.state.complete_class:"task"}>
                                <div className="owner_and_date">
                                    <p className="task_owner">{task.task_owner}</p>
                                    <p className="creation_date">{task.creation_date != ""? new Intl.DateTimeFormat("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "2-digit",
                                        hour: "numeric",
                                        minute: "numeric",
                                        timeZone: "America/New_York"
                                    }).format(new Date(task.creation_date)): null}</p>
                                </div>

                                <div className="description_and_options">
                                    <textarea className="task_description" name={i} onBlur={() => this.props.edit_task(task.id, task.task_description)}
                                        onChange={this.props.handleChange2} value={task.task_description}>
                                    </textarea>

                                    {this.props.current_user === task.task_owner?
                                        <div className="task_dropdown">
                                            <i className="fas fa-ellipsis-h"></i>

                                            
                                            <div className="task_dropdown_content">
                                               {task.completed === false?
                                                    <a onClick={() => this.props.complete_task(task.id, true)}><i className="fas fa-check"></i>Mark as complete</a>: 
                                                    <a onClick={() => this.props.complete_task(task.id, false)}><i className="fas fa-times"></i>Mark as incomplete</a>}
                                                <a onClick={() => this.props.delete_task(task.id)}><i className="fas fa-trash-alt"></i>Delete</a> 
                                            </div>

                                        </div>:null}
                                </div>

                                {task.completed===true?<div className="completed_tag">COMPLETED</div>: null}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }
}

// Notifications
class Notifications extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            board_name: "",
            notification_count: 0,
            visible: false,
            add_request_to: "",
            add_request_id: "",
            add_request_project: "",
        }
    }

    componentDidMount() {
        const notifications = this.props.add_requests.filter(item => item.to === this.props.current_user)

        this.setState({
            notification_count: notifications.length,
        })
    }

    // Adding collaborator to project
    add_person = (answer, request_id, to, project, board_name) => {

        if (answer === 'allow') {

            // Add to project
            fetch('/apicollaborators/', {
                method: 'POST',
                body: JSON.stringify({
                    collaborator_name: to,
                    project: project
                }),
                headers: { "X-CSRFToken": this.props.csrftoken, "Content-Type": "application/JSON" }
            })

            // Get board id
            let index = this.props.boards.findIndex(x => x.board_name === board_name && x.board_creator === to);

            let id = this.props.boards[index]['id']

            // Get board projects
            fetch(`/apiboards/${id}/`)
            .then(response => response.json())
            .then(board => {

                let project_ids = [];
                var i;

                for (i=0; i < board['projects'].length; i++) {
                    project_ids.push(board['projects'][i]['id'])
                }

                project_ids.push(project)

                // Add it to the board
                fetch(`/apiboards/${id}/`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        projects: project_ids,
                    }),
                    headers: { "X-CSRFToken": this.props.csrftoken, "Content-Type": "application/JSON" }
                }) 
            }); 

        }

        // Delete notification
        fetch(`/apiadd_requests/${request_id}`, {
            method: 'DELETE',
            headers: { "X-CSRFToken": this.props.csrftoken, "Content-Type": "application/JSON" }
        })
        .then(() => {
            window.location.reload()
        });     
    }

    // Handle Change
    handleChange = (event) => {

        this.setState({
            [event.target.name]: event.target.value
        });
    }

    // Accept button
    accept_button = () => {
        let index = this.props.boards.findIndex(x => x.board_creator === this.props.current_user)

        // Set the board name to the first board the current user has so that the user can add a project to their board
        // in the case that they only have one board (cause you can't select the board if there's only one so we have to
        // select it for them by default)
        if (index !== -1) {
            let board_name = this.props.boards[index]['board_name']

            this.setState({
                board_name: board_name,
            })
        }
    }

    render() {
        return(
            <div>
                {this.state.visible === true? <div className="bg-modal4">
                    <div className="add_to_board">
                        <a className="close" onClick={() => this.setState({visible: false})}>&times;</a>

                        {this.props.boards.findIndex(x => x.board_creator === this.props.current_user) !== -1?
                        <div>
                            <p className="add_to_board_text">Please select a board to add this project to:</p>
                            
                            <select className="select_dropdown" name="board_name" value={this.state.board_name} onChange={this.handleChange}>
                                {this.props.boards.map(board => {
                                    if (board.board_creator === this.props.current_user) {
                                        return (<option key={board.id} value={board.board_name}>{board.board_name}</option>)
                                    }
                                })}
                            </select> <br />

                            <button className="button-primary center-btn margin-bottom" onClick={() => 
                                this.add_person('allow', this.state.add_request_id, this.state.add_request_to, 
                                    this.state.add_request_project, this.state.board_name)}>Accept</button>
                        </div>: <p className="no-boards-msg">You cannot add this project because you have no boards to add it too! Please create a board first.</p>}
                    </div>
                </div>: null}

                <div className="notifications_dropdown" style={{float: "left"}}>
                    <span className="fa-layers fa-fw">
                        <i className="fas fa-bell notifications_button"></i>
                        {this.state.notification_count>0? 
                            <span className="notification-count">{this.state.notification_count}</span>: null}
                    </span>
                    <div className="notification-content">
                        {this.props.add_requests.map(add_request => {
                            if (this.props.current_user === add_request.to) {
                                return(
                                    <a key={add_request.id}>
                                        <p className="username">{add_request.sent_by}</p> wants to add you to "{add_request.project_name}" <br />
                                        <button className="button-primary" 
                                            onClick={() => 
                                                {this.accept_button(); this.setState({
                                                visible: true, 
                                                add_request_id: add_request.id, 
                                                add_request_to: add_request.to,
                                                add_request_project: add_request.project})}}>Accept</button>
                                        <button className="button-primary no_delete" onClick={() => this.add_person('deny', add_request.id)}>Deny</button>
                                    </a>)
                            }
                        })}
                    </div>
                </div>
            </div>
        )   
    }
}

// Navbar
class Navbar extends React.Component {

    render() {
        return(
            <div id="nav-bar-bar">
                <ul id="nav-bar">
                    <div className="logo-user">
                        <li><img className="logo" src={"static/final/LogoMakr-1Oa3f1.png"} alt="Logo" /></li>
                        <li className="signed_in_as">Signed in as <p className="nav-username" style={{"fontWeight": "bold"}}>{this.props.current_user}</p></li>
                    </div>
                    <div id="notifcation-nav"></div>
                    <li><a className="download_report" href={this.props.file_name} download>Download Report</a></li>
                    <li>
                        <Notifications add_requests={this.props.add_requests} 
                                    current_user={this.props.current_user} 
                                    csrftoken={this.props.csrftoken}
                                    close_modal={this.props.close_modal}
                                    boards={this.props.boards}
                                    board_name={this.props.board_name} />
                    </li>
                    <li className="logout"><a href="/logout">Log Out</a></li>
                </ul>
            </div>
        )
    }
}

// Messages 
class Messages extends React.Component {

    render() {
        return (
            <div>
                {this.props.message_visibility === true?
                    <div className={this.props.message_class}>
                    <p className="message">{this.props.message}</p>
                    <span onClick={this.props.close_message} className="close_alert">&times;</span>
                </div>: null}
            </div>
        )
    }
}

// Project Messages
class Project_messages extends React.Component {

    render() {
        return (
            <div className="project_messages">
                {this.props.project_message_visibility === true?
                    <div className={this.props.project_message_class}>
                    <p className="message">{this.props.project_message}</p>
                    <span onClick={this.props.close_project_message} className="close_alert">&times;</span>
                </div>: null}
            </div>
        )
    }
}

// Completed banner
class Completed_banner extends React.Component {

    render() {
        return (
            <div className="completed_banner">
                {this.props.completed === true?
                    <div className="alert alert-success">
                        <p className="message">This project has been marked completed.</p>
                    </div>: null}
            </div>
        )
    }
}

