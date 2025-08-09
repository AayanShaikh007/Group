# Group App

## Project Goals
The Group app will have a number of features and functionalities that will need to be implemented, which is why I will try to clearly state the goals for the project so that project work can be as optimized as possible. 

These are the x pages that I am going to have in the app. 

1. Loading/Greeting Screen

- This will be a simple cascade of images explaining the app and what it does. It will only run on the initial installation of the app (is login == true??) 

2. Group join Screens
- Functionalities required: Random id generator, web server
- On these screens, the user will be asked to either make or join a group. 
- Then, the user will either be given a unique code to share with their group (qr code??), or be shown a screen to enter their group's unique code. 

**The user is now in the most used part of the app. There will be a number of screens the user will be able to use here.**

1. Chat screen
- A large group chat with all of the people in your group. 

2. Home / Map Screen. 
- Shows a map with the most recent locations of all the people in the group. 

3.  Settings // Status Screen
- This screen will show the status of the device (wifi connectivity, etc). 
- It will also guide the user to the settings page / tab (might put it all in one page with the status screen). 
- Settings include accesssing the initial loading/greeting guide again, light/dark mode, etc. 

**make changes as necessary**

# August 6th- Project Start

I spent some time making the project goals today, and setting up the development environment. I will start by making the loading/greeting screen. 

# August 8th- Continuing work on loading screen. 
Lets start with the loading/greeting screen. I already got some progress making a cascade of images yesterday, so i will continue working on that. I was able to setup the cascade stack today. I decided to make the loading screen stack seperate from the main pages, and will add the code entry page soon. 



# Notes

- Use <FlatList> for chat message page (more efficient)
- Need to find out how to use qr code to hold the group identifer code.